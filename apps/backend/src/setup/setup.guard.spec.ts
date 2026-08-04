import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SetupGuard } from './setup.guard';
import { SetupStateService } from './setup-state.service';
import { SETUP_EXEMPT_KEY, SETUP_ONLY_KEY } from './setup.decorators';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

/** Contexte HTTP minimal, porteur des seules métadonnées que le garde lit. */
function httpContext(
  metadata: Partial<Record<string, boolean>> = {},
): ExecutionContext {
  const handler = () => undefined;
  Object.entries(metadata).forEach(([key, value]) =>
    Reflect.defineMetadata(key, value, handler),
  );
  return {
    getType: () => 'http',
    getHandler: () => handler,
    getClass: () => class Anonymous {},
  } as unknown as ExecutionContext;
}

describe('SetupGuard', () => {
  let prisma: MockPrisma;
  let state: SetupStateService;
  let guard: SetupGuard;

  beforeEach(() => {
    prisma = createMockPrisma();
    state = new SetupStateService(prisma as any);
    guard = new SetupGuard(new Reflector(), state);
  });

  describe('avant installation', () => {
    beforeEach(() => {
      prisma.restaurant.findUnique.mockResolvedValue(null);
      prisma.user.count.mockResolvedValue(0);
    });

    it('ferme les routes métier avec un 503 SETUP_REQUIRED', async () => {
      await expect(guard.canActivate(httpContext())).rejects.toMatchObject({
        status: 503,
        response: expect.objectContaining({
          code: 'SETUP_REQUIRED',
          setupRequired: true,
        }),
      });
    });

    it('laisse passer les routes exemptées (état, sondes de santé)', async () => {
      await expect(
        guard.canActivate(httpContext({ [SETUP_EXEMPT_KEY]: true })),
      ).resolves.toBe(true);
    });

    it("laisse passer l'assistant lui-même", async () => {
      await expect(
        guard.canActivate(httpContext({ [SETUP_ONLY_KEY]: true })),
      ).resolves.toBe(true);
    });
  });

  describe('après installation', () => {
    beforeEach(() => {
      prisma.restaurant.findUnique.mockResolvedValue({ setupCompleted: true });
      prisma.user.count.mockResolvedValue(1);
    });

    it('rouvre les routes métier', async () => {
      await expect(guard.canActivate(httpContext())).resolves.toBe(true);
    });

    it("répond 403 à toute nouvelle tentative d'installation", async () => {
      const promise = guard.canActivate(
        httpContext({ [SETUP_ONLY_KEY]: true }),
      );

      await expect(promise).rejects.toThrow(ForbiddenException);
      await expect(promise).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'SETUP_ALREADY_COMPLETED',
        }),
      });
    });

    it("bloque encore l'assistant si le compte racine a disparu", async () => {
      // L'établissement est configuré, mais plus personne ne peut administrer :
      // l'assistant doit se rouvrir pour recréer ce seul compte.
      prisma.user.count.mockResolvedValue(0);

      await expect(
        guard.canActivate(httpContext({ [SETUP_ONLY_KEY]: true })),
      ).resolves.toBe(true);
    });

    it("ne relit l'état de la base qu'une seule fois", async () => {
      await guard.canActivate(httpContext());
      await guard.canActivate(httpContext());
      await guard.canActivate(httpContext());

      expect(prisma.restaurant.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  it('ignore les contextes non HTTP (WebSocket)', async () => {
    const wsContext = { getType: () => 'ws' } as unknown as ExecutionContext;
    await expect(guard.canActivate(wsContext)).resolves.toBe(true);
    expect(prisma.restaurant.findUnique).not.toHaveBeenCalled();
  });

  it('laisse passer si la base est injoignable, plutôt que de fermer le service', async () => {
    prisma.restaurant.findUnique.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(guard.canActivate(httpContext())).resolves.toBe(true);
  });
});
