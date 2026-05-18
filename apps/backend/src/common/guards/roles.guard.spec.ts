import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function makeCtx(overrides: {
  roles?: string[] | undefined;
  user?: Record<string, unknown> | null;
  membership?: { role: string } | null;
}) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(overrides.roles),
  } as unknown as Reflector;
  const request: any = {
    user: overrides.user ?? null,
    membership: overrides.membership ?? null,
  };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as any;
  return { ctx, reflector };
}

describe('RolesGuard', () => {

  // ─── No roles required ────────────────────────────────────────────────────

  it('returns true when no @Roles() decorator is set', () => {
    const { ctx, reflector } = makeCtx({ roles: undefined, user: { id: 'u1' } });
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // ─── super_admin bypass ───────────────────────────────────────────────────

  it('returns true for super_admin regardless of required roles', () => {
    const { ctx, reflector } = makeCtx({
      roles: ['owner'],
      user: { id: 'u1', platformRole: 'super_admin' },
      membership: null,
    });
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true for super_admin even when no membership exists', () => {
    const { ctx, reflector } = makeCtx({
      roles: ['owner', 'manager'],
      user: { id: 'u1', platformRole: 'super_admin' },
      membership: null,
    });
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // ─── Missing user / membership ────────────────────────────────────────────

  it('throws ForbiddenException when user is null', () => {
    const { ctx, reflector } = makeCtx({
      roles: ['owner'],
      user: null,
    });
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when membership is missing (non super_admin)', () => {
    const { ctx, reflector } = makeCtx({
      roles: ['owner'],
      user: { id: 'u1', platformRole: 'user' },
      membership: null,
    });
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  // ─── Role matching ────────────────────────────────────────────────────────

  it('returns true when membership role is in the required roles list', () => {
    const { ctx, reflector } = makeCtx({
      roles: ['owner', 'manager'],
      user: { id: 'u1', platformRole: 'user' },
      membership: { role: 'manager' },
    });
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException when membership role is NOT in required roles', () => {
    const { ctx, reflector } = makeCtx({
      roles: ['owner'],
      user: { id: 'u1', platformRole: 'user' },
      membership: { role: 'waiter' },
    });
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('grants access to all listed roles individually', () => {
    const guard = new RolesGuard(
      { getAllAndOverride: jest.fn().mockReturnValue(['owner', 'manager', 'head_chef']) } as any,
    );
    for (const role of ['owner', 'manager', 'head_chef']) {
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u1', platformRole: 'user' }, membership: { role } }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;
      expect(guard.canActivate(ctx)).toBe(true);
    }
  });

  it('blocks roles not in the allowed list', () => {
    const guard = new RolesGuard(
      { getAllAndOverride: jest.fn().mockReturnValue(['owner']) } as any,
    );
    for (const role of ['manager', 'waiter', 'chef', 'cashier']) {
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u1', platformRole: 'user' }, membership: { role } }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    }
  });
});
