import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';
import { createMockPrisma, MockPrisma } from '../../__tests__/prisma.mock';

// ─── ExecutionContext factory ────────────────────────────────────────────────
function makeCtx(overrides: {
  isPublic?: boolean;
  headers?: Record<string, string>;
  user?: Record<string, unknown> | null;
}) {
  const request: any = {
    headers: overrides.headers ?? {},
    user: overrides.user ?? null,
  };
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(overrides.isPublic ?? false),
  } as unknown as Reflector;
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as any;
  return { ctx, request, reflector };
}

describe('TenantGuard', () => {
  let prisma: MockPrisma;
  const tenant = { id: 'tenant-1', slug: 'le-maquis', name: 'Le Maquis' };
  const membership = { id: 'm1', role: 'owner' };

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  // ─── No tenant headers ────────────────────────────────────────────────────

  describe('when no x-tenant-id or x-tenant-slug headers', () => {
    it('returns true for @Public() routes', async () => {
      const { ctx, reflector } = makeCtx({ isPublic: true });
      const guard = new TenantGuard(reflector, prisma as any);
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('returns true for super_admin even on protected routes', async () => {
      const { ctx, reflector } = makeCtx({
        isPublic: false,
        user: { id: 'u1', platformRole: 'super_admin' },
      });
      const guard = new TenantGuard(reflector, prisma as any);
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('throws ForbiddenException on protected route with no tenant context', async () => {
      const { ctx, reflector } = makeCtx({
        isPublic: false,
        user: { id: 'u1', platformRole: 'user' },
      });
      const guard = new TenantGuard(reflector, prisma as any);
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Tenant resolution ────────────────────────────────────────────────────

  describe('tenant resolution', () => {
    it('resolves tenant by x-tenant-id header', async () => {
      prisma.tenant.findFirst.mockResolvedValue(tenant);
      prisma.tenantMembership.findUnique.mockResolvedValue(membership);

      const { ctx, request, reflector } = makeCtx({
        headers: { 'x-tenant-id': 'tenant-1' },
        user: { id: 'u1' },
      });
      const guard = new TenantGuard(reflector, prisma as any);

      await guard.canActivate(ctx);

      expect(prisma.tenant.findFirst).toHaveBeenCalledWith({
        where: { id: 'tenant-1', deletedAt: null },
      });
      expect(request.tenant).toEqual(tenant);
    });

    it('resolves tenant by x-tenant-slug header', async () => {
      prisma.tenant.findFirst.mockResolvedValue(tenant);
      prisma.tenantMembership.findUnique.mockResolvedValue(membership);

      const { ctx, request, reflector } = makeCtx({
        headers: { 'x-tenant-slug': 'le-maquis' },
        user: { id: 'u1' },
      });
      const guard = new TenantGuard(reflector, prisma as any);

      await guard.canActivate(ctx);

      expect(prisma.tenant.findFirst).toHaveBeenCalledWith({
        where: { slug: 'le-maquis', deletedAt: null },
      });
      expect(request.tenant).toEqual(tenant);
    });

    it('throws NotFoundException when tenant does not exist', async () => {
      prisma.tenant.findFirst.mockResolvedValue(null);

      const { ctx, reflector } = makeCtx({
        headers: { 'x-tenant-id': 'ghost-tenant' },
        user: { id: 'u1' },
      });
      const guard = new TenantGuard(reflector, prisma as any);

      await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Membership verification ──────────────────────────────────────────────

  describe('membership verification on protected routes', () => {
    it('throws ForbiddenException when user is not a member', async () => {
      prisma.tenant.findFirst.mockResolvedValue(tenant);
      prisma.tenantMembership.findUnique.mockResolvedValue(null);

      const { ctx, reflector } = makeCtx({
        headers: { 'x-tenant-id': 'tenant-1' },
        user: { id: 'u1' },
      });
      const guard = new TenantGuard(reflector, prisma as any);

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when user is null on protected route', async () => {
      prisma.tenant.findFirst.mockResolvedValue(tenant);

      const { ctx, reflector } = makeCtx({
        headers: { 'x-tenant-id': 'tenant-1' },
        user: null,
        isPublic: false,
      });
      const guard = new TenantGuard(reflector, prisma as any);

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('sets request.membership on success', async () => {
      prisma.tenant.findFirst.mockResolvedValue(tenant);
      prisma.tenantMembership.findUnique.mockResolvedValue(membership);

      const { ctx, request, reflector } = makeCtx({
        headers: { 'x-tenant-id': 'tenant-1' },
        user: { id: 'u1' },
      });
      const guard = new TenantGuard(reflector, prisma as any);

      await guard.canActivate(ctx);

      expect(request.membership).toEqual(membership);
    });

    it('skips membership check for @Public() routes even with tenant header', async () => {
      prisma.tenant.findFirst.mockResolvedValue(tenant);

      const { ctx, reflector } = makeCtx({
        isPublic: true,
        headers: { 'x-tenant-id': 'tenant-1' },
      });
      const guard = new TenantGuard(reflector, prisma as any);

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(prisma.tenantMembership.findUnique).not.toHaveBeenCalled();
    });
  });
});
