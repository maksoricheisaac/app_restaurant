/**
 * Auth flow integration tests.
 *
 * Uses NestJS TestingModule — tests the interaction between:
 * AuthMiddleware → AuthGuard → AuthService
 * with Prisma and mail service mocked.
 *
 * This validates that the full request pipeline works correctly
 * without needing a real database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const makePrismaMock = () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn(),
    create: jest.fn().mockResolvedValue({ id: 'rt-1' }),
    delete: jest.fn(),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  tenant: { findUnique: jest.fn(), findFirst: jest.fn() },
  tenantMembership: { findUnique: jest.fn(), findMany: jest.fn() },
  $queryRaw: jest.fn().mockResolvedValue([]),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
});

describe('Auth Flow Integration', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof makePrismaMock>;

  beforeAll(async () => {
    // Env vars are set by test/integration-env-setup.ts (runs before module load)
    prismaMock = makePrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(MailService)
      .useValue({
        sendEmailVerification: jest.fn().mockResolvedValue(undefined),
        sendPasswordReset: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        stopAtFirstError: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.refreshToken.findMany.mockResolvedValue([]);
    prismaMock.refreshToken.create.mockResolvedValue({ id: 'rt-1' });
    prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
  });

  // ─── Login ────────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    const validCredentials = {
      email: 'alice@test.com',
      password: 'Password@1',
    };

    it('returns 401 for unknown user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(validCredentials)
        .expect(401);
    });

    it('returns 401 for unverified email', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'alice@test.com',
        password: '$2b$10$validhash',
        emailVerified: false,
        memberships: [],
      });
      // Make bcrypt.compare return true for this test
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(validCredentials)
        .expect(401);
    });

    it('returns 4xx when email is missing (Passport returns 401 before ValidationPipe)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ password: 'Password@1' });
      // LocalAuthGuard (Passport) runs before ValidationPipe — missing email → 401
      expect([400, 401]).toContain(res.status);
    });
  });

  // ─── Profile ──────────────────────────────────────────────────────────────

  describe('GET /api/v1/auth/profile', () => {
    it('returns 401 without JWT cookie', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });
  });

  // ─── resend-verification ──────────────────────────────────────────────────

  describe('POST /api/v1/auth/resend-verification', () => {
    it('returns 400 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .send({})
        .expect(400);
    });

    it('returns 400 when email is invalid format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'not-an-email' })
        .expect(400);
    });

    it('returns 201 for valid email (anti-enumeration — same response)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // user doesn't exist

      await request(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'ghost@test.com' })
        .expect(201);
    });
  });

  // ─── forgot-password ─────────────────────────────────────────────────────

  describe('POST /api/v1/auth/forgot-password', () => {
    it('returns 400 for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'bad-email' })
        .expect(400);
    });

    it('returns 201 for any valid email (anti-enumeration)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'ghost@test.com' })
        .expect(201);
    });
  });

  // ─── Health (integration smoke test) ─────────────────────────────────────

  describe('GET /api/v1/health', () => {
    it('returns 200 with status ok when DB is reachable', async () => {
      prismaMock.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(res.body.status).toBe('ok');
    });

    it('returns degraded status when DB is down', async () => {
      prismaMock.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      const res = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(res.body.status).toBe('degraded');
      expect(res.body.checks.database.status).toBe('error');
    });
  });

  // ─── Public routes are accessible without auth ─────────────────────────

  describe('Public routes access', () => {
    it('GET /api/v1/health/live returns 200 without auth', async () => {
      await request(app.getHttpServer()).get('/api/v1/health/live').expect(200);
    });

    it('GET /api/v1/health/ready returns 200 when DB reachable', async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);
      await request(app.getHttpServer())
        .get('/api/v1/health/ready')
        .expect(200);
    });
  });
});
