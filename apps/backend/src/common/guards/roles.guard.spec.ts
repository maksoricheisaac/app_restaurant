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
      // `AuthGuard` relit le rôle en base et écrase celui du jeton. Un jeton
      // qui se prétend racine n'ouvre donc rien : seul `user.role`, chargé
      // depuis la base, est pris en compte ici.
      user: { id: 'u1', role: 'waiter', platformRole: 'super_admin' },
    });
    expect(() => new RolesGuard(reflector).canActivate(ctx)).toThrow(
      ForbiddenException,
    );
  });

  describe('compte racine', () => {
    it("satisfait une exigence où il n'est pas nommé", () => {
      const { ctx, reflector } = makeCtx({
        roles: ['owner', 'manager'],
        user: { id: 'u1', role: 'super_admin' },
      });
      expect(new RolesGuard(reflector).canActivate(ctx)).toBe(true);
    });

    it('passe partout, quelle que soit la liste exigée', () => {
      const combinations = [['owner'], ['cashier'], ['chef', 'waiter'], []];

      for (const roles of combinations) {
        const { ctx, reflector } = makeCtx({
          roles,
          user: { id: 'u1', role: 'super_admin' },
        });
        expect(new RolesGuard(reflector).canActivate(ctx)).toBe(true);
      }
    });
  });
});
