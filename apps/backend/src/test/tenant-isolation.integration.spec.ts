/**
 * Tenant isolation integration tests.
 *
 * Verifies that the TenantGuard + RolesGuard pipeline correctly
 * isolates tenant data and prevents cross-tenant access.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

// Must match the secret used in auth-flow.integration.spec.ts (shared module cache)
const JWT_SECRET = 'integration-test-secret-at-least-32-chars';

function signToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

const makePrismaMock = () => ({
  user: { findUnique: jest.fn(), update: jest.fn() },
  tenant: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  tenantMembership: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn().mockResolvedValue(1),
  },
  order: {
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  },
  menuItem: {
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  },
  table: { count: jest.fn().mockResolvedValue(0) },
  menuCategory: { findMany: jest.fn().mockResolvedValue([]) },
  restaurantSettings: { findUnique: jest.fn().mockResolvedValue(null) },
  $queryRaw: jest.fn().mockResolvedValue([]),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
});

describe('Tenant Isolation Integration', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof makePrismaMock>;

  const tenant1 = {
    id: 'tenant-1',
    slug: 't1',
    name: 'T1',
    plan: 'pro',
    status: 'active',
  };
  const tenant2 = {
    id: 'tenant-2',
    slug: 't2',
    name: 'T2',
    plan: 'free',
    status: 'active',
  };
  const token1 = signToken({
    sub: 'user-1',
    email: 'u1@t.com',
    role: 'owner',
    platformRole: 'user',
    tenantId: 'tenant-1',
  });

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
        sendEmailVerification: jest.fn(),
        sendPasswordReset: jest.fn(),
      })
      .compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.order.count.mockResolvedValue(0);
    prismaMock.menuItem.findMany.mockResolvedValue([]);
    prismaMock.menuItem.count.mockResolvedValue(0);
    prismaMock.table.count.mockResolvedValue(0);
  });

  // ─── Cross-tenant access blocked ──────────────────────────────────────────

  describe('cross-tenant access prevention', () => {
    it('blocks access to tenant-2 resources when user belongs to tenant-1', async () => {
      // User has JWT for tenant-1 but sends header for tenant-2
      prismaMock.tenant.findFirst.mockResolvedValue(tenant2);
      prismaMock.tenantMembership.findUnique.mockResolvedValue(null); // not a member of tenant-2

      await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token1}`)
        .set('x-tenant-id', 'tenant-2')
        .expect(403);
    });

    it('allows access to own tenant resources', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue(tenant1);
      prismaMock.tenantMembership.findUnique.mockResolvedValue({
        id: 'm1',
        role: 'owner',
      });

      await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token1}`)
        .set('x-tenant-id', 'tenant-1')
        .expect(200);
    });
  });

  // ─── Unauthenticated access blocked on protected routes ──────────────────

  describe('unauthenticated access', () => {
    it('returns 401 for protected routes without any token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('x-tenant-id', 'tenant-1')
        .expect(401);
    });

    it('returns 403 for protected routes without tenant header', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token1}`)
        // no x-tenant-id header
        .expect(403);
    });
  });

  // ─── Public routes accessible without auth ───────────────────────────────

  describe('public routes', () => {
    it('GET /public-menu/:slug is accessible without auth or tenant header', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(tenant1);
      prismaMock.menuCategory.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/public-menu/t1')
        .expect(200);
    });
  });

  // ─── super_admin bypasses tenant guard ───────────────────────────────────

  describe('super_admin access', () => {
    const adminToken = signToken({
      sub: 'admin-1',
      email: 'admin@flashmenu.com',
      role: 'super_admin',
      platformRole: 'super_admin',
      tenantId: null,
    });

    it('allows super_admin access without x-tenant-id header', async () => {
      // super_admin can hit tenant-agnostic routes without tenant context
      await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Cookie', `token=${adminToken}`)
        .expect(200);
    });
  });

  // ─── Plan usage endpoint requires tenant ─────────────────────────────────

  describe('plan usage', () => {
    it('returns usage summary for authenticated user with tenant', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue(tenant1);
      prismaMock.tenantMembership.findUnique.mockResolvedValue({
        id: 'm1',
        role: 'owner',
      });
      prismaMock.tenant.findUnique.mockResolvedValue(tenant1);

      const res = await request(app.getHttpServer())
        .get('/api/v1/plans/usage')
        .set('Authorization', `Bearer ${token1}`)
        .set('x-tenant-id', 'tenant-1')
        .expect(200);

      expect(res.body.plan).toBeDefined();
      expect(res.body.usage).toBeDefined();
    });
  });
});
