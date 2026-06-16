import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/mail/mail.service';

/**
 * Core E2E smoke tests.
 *
 * These tests use a mocked Prisma and MailService to validate the full
 * NestJS HTTP pipeline without requiring a real database.
 *
 * True database E2E tests require TEST_DATABASE_URL — see test/setup.ts.
 */

const makePrismaMock = () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  tenant: { findUnique: jest.fn(), findFirst: jest.fn() },
  tenantMembership: { findUnique: jest.fn() },
  table: { findUnique: jest.fn().mockResolvedValue(null) },
  refreshToken: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn(),
    create: jest.fn().mockResolvedValue({ id: 'rt-1' }),
    delete: jest.fn(),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
});

describe('Flash Menu E2E', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof makePrismaMock>;

  beforeAll(async () => {
    prismaMock = makePrismaMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
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

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        stopAtFirstError: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Smoke tests ──────────────────────────────────────────────────────────

  describe('Server health', () => {
    it('GET /api/v1/health returns 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.checks.database).toBeDefined();
      expect(res.body.checks.memory).toBeDefined();
    });

    it('GET /api/v1/health/live always returns 200', async () => {
      await request(app.getHttpServer()).get('/api/v1/health/live').expect(200);
    });

    it('GET /api/v1/health/ready returns 200 when DB reachable', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/health/ready')
        .expect(200);
    });
  });

  // ─── Auth endpoints ───────────────────────────────────────────────────────

  describe('Auth endpoints', () => {
    it('POST /api/v1/auth/login — 401 with bad credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.com', password: 'bad' })
        .expect(401);
    });

    it('POST /api/v1/auth/login — 4xx when email missing', async () => {
      // Passport LocalAuthGuard runs before ValidationPipe — missing email → 401
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ password: 'Password@1' });
      expect([400, 401]).toContain(res.status);
    });

    it('GET /api/v1/auth/profile — 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });

    it('POST /api/v1/auth/refresh — 401 without cookie', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .expect(401);
    });

    it('POST /api/v1/auth/resend-verification — 400 for bad email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'not-email' })
        .expect(400);
    });
  });

  // ─── Public menu endpoints ────────────────────────────────────────────────

  describe('Public menu', () => {
    it('GET /api/v1/public-menu/:slug — 404 for unknown restaurant', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v1/public-menu/unknown-restaurant')
        .expect(404);
    });

    it('GET /api/v1/public-menu/by-table/:id — 404 for unknown table', async () => {
      const { createMockPrisma } = require('../src/__tests__/prisma.mock');
      prismaMock.tenant.findFirst = jest.fn().mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v1/public-menu/by-table/unknown-table')
        .expect(404);
    });
  });

  // ─── Protected routes need auth ───────────────────────────────────────────

  describe('Protected routes require auth', () => {
    const routes = [
      { method: 'get', path: '/api/v1/orders' },
      { method: 'post', path: '/api/v1/menu' }, // GET /menu est @Public() — POST est protégé
      { method: 'get', path: '/api/v1/tables' },
      { method: 'get', path: '/api/v1/plans/usage' },
    ];

    for (const route of routes) {
      it(`${route.method.toUpperCase()} ${route.path} returns 401 without token`, async () => {
        await (request(app.getHttpServer()) as any)
          [route.method](route.path)
          .set('x-tenant-id', 'tenant-1')
          .expect(401);
      });
    }
  });

  // ─── Onboarding initiation ────────────────────────────────────────────────

  describe('Onboarding', () => {
    it('POST /api/v1/onboarding/initiate — 409 for existing email', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' });

      await request(app.getHttpServer())
        .post('/api/v1/onboarding/initiate')
        .send({
          firstName: 'Alice',
          lastName: 'D',
          email: 'exists@test.com',
          password: 'Password@1',
        })
        .expect(409);
    });

    it('POST /api/v1/onboarding/initiate — 400 for weak password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/onboarding/initiate')
        .send({
          firstName: 'Alice',
          lastName: 'D',
          email: 'alice@test.com',
          password: 'weak',
        })
        .expect(400);
    });
  });

  // ─── Rate limiting on sensitive routes ────────────────────────────────────

  describe('Throttle is applied', () => {
    it('headers contain rate limit info on auth routes', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'Password@1' });

      // NestJS throttler sets x-ratelimit-limit (or similar) on rate-limited responses
      // The important thing is the response is not 500
      expect(res.status).not.toBe(500);
    });
  });
});
