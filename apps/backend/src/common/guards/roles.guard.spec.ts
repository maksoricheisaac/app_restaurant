import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function makeCtx(overrides: {
  roles?: string[] | undefined;
  user?: Record<string, unknown> | null;
}) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(overrides.roles),
  } as unknown as Reflector;
  const request: any = { user: overrides.user ?? null };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as any;
  return { ctx, reflector };
}

describe('RolesGuard', () => {
  it('laisse passer quand aucun @Roles() n’est posé', () => {
    const { ctx, reflector } = makeCtx({
      roles: undefined,
      user: { id: 'u1' },
    });
    expect(new RolesGuard(reflector).canActivate(ctx)).toBe(true);
  });

  it('refuse quand la requête n’a pas d’utilisateur', () => {
    const { ctx, reflector } = makeCtx({ roles: ['owner'], user: null });
    expect(() => new RolesGuard(reflector).canActivate(ctx)).toThrow(
      ForbiddenException,
    );
  });

  it('laisse passer quand le rôle du compte figure dans la liste', () => {
    const { ctx, reflector } = makeCtx({
      roles: ['owner', 'manager'],
      user: { id: 'u1', role: 'manager' },
    });
    expect(new RolesGuard(reflector).canActivate(ctx)).toBe(true);
  });

  it('refuse quand le rôle du compte ne figure pas dans la liste', () => {
    const { ctx, reflector } = makeCtx({
      roles: ['owner'],
      user: { id: 'u1', role: 'waiter' },
    });
    expect(() => new RolesGuard(reflector).canActivate(ctx)).toThrow(
      ForbiddenException,
    );
  });

  it('accepte chacun des rôles listés', () => {
    const guard = new RolesGuard({
      getAllAndOverride: jest
        .fn()
        .mockReturnValue(['owner', 'manager', 'chef']),
    } as any);

    for (const role of ['owner', 'manager', 'chef']) {
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'u1', role } }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;
      expect(guard.canActivate(ctx)).toBe(true);
    }
  });

  it('bloque tous les rôles absents de la liste', () => {
    const guard = new RolesGuard({
      getAllAndOverride: jest.fn().mockReturnValue(['owner']),
    } as any);

    for (const role of ['manager', 'waiter', 'chef', 'cashier']) {
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'u1', role } }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    }
  });

  it("n'accorde aucun privilège implicite : le rôle vient du compte, pas du jeton", () => {
    const { ctx, reflector } = makeCtx({
      roles: ['owner'],
      // Un ancien jeton pouvait porter platformRole: 'super_admin' — cette
      // notion n'existe plus et ne doit ouvrir aucune porte.
      user: { id: 'u1', role: 'waiter', platformRole: 'super_admin' },
    });
    expect(() => new RolesGuard(reflector).canActivate(ctx)).toThrow(
      ForbiddenException,
    );
  });
});
