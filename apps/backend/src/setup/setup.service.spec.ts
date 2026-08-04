import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SetupService } from './setup.service';
import { SetupStateService } from './setup-state.service';
import { AuditService } from '../common/audit/audit.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';
import { CompleteSetupDto } from './dto/setup.dto';

const VALID_PAYLOAD = {
  superAdmin: {
    firstName: 'Riche',
    lastName: 'Makso',
    email: 'admin@example.com',
    password: 'StrongPassword123!',
  },
  restaurant: {
    name: 'Chez Flash',
    currency: 'EUR',
    timezone: 'Europe/Paris',
  },
} as CompleteSetupDto;

const CREATED_ROOT = {
  id: 'root-1',
  email: 'admin@example.com',
  name: 'Riche Makso',
  role: 'super_admin',
};

function uniqueViolation(target?: string[]) {
  return new Prisma.PrismaClientKnownRequestError('unique', {
    code: 'P2002',
    clientVersion: '6',
    meta: target ? { target } : undefined,
  });
}

describe('SetupService', () => {
  let prisma: MockPrisma;
  let state: SetupStateService;
  let audit: { record: jest.Mock };
  let service: SetupService;

  beforeEach(() => {
    prisma = createMockPrisma();
    state = new SetupStateService(prisma as any);
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    service = new SetupService(
      prisma as any,
      state,
      audit as unknown as AuditService,
    );
  });

  describe('getStatus', () => {
    it("annonce une installation requise tant qu'aucun établissement n'existe", async () => {
      prisma.restaurant.findUnique.mockResolvedValue(null);
      prisma.user.count.mockResolvedValue(0);

      await expect(service.getStatus()).resolves.toEqual({
        setupRequired: true,
        required: true,
        restaurantName: null,
        recovery: false,
      });
    });

    it("annonce l'installation faite et amorce le cache du garde", async () => {
      prisma.restaurant.findUnique.mockResolvedValue({
        setupCompleted: true,
        name: 'Chez Flash',
      });
      prisma.user.count.mockResolvedValue(1);

      await expect(service.getStatus()).resolves.toEqual({
        setupRequired: false,
        required: false,
        restaurantName: 'Chez Flash',
        recovery: false,
      });
      await expect(state.isCompleted()).resolves.toBe(true);
    });

    it('signale une reprise quand le compte racine a disparu', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({
        setupCompleted: true,
        name: 'Chez Flash',
      });
      prisma.user.count.mockResolvedValue(0);

      await expect(service.getStatus()).resolves.toMatchObject({
        setupRequired: true,
        recovery: true,
        restaurantName: 'Chez Flash',
      });
    });
  });

  describe('complete', () => {
    /** @param existing établissement déjà en base, ou `null` pour une installation neuve. */
    function stubTransaction(
      existing: {
        id: string;
        name: string;
        setupCompleted: boolean;
      } | null = null,
    ) {
      const tx = createMockPrisma();
      tx.restaurant.findUnique.mockResolvedValue(existing);
      tx.restaurant.create.mockResolvedValue({
        id: 'restaurant',
        name: 'Chez Flash',
        setupCompleted: true,
      });
      tx.restaurant.update.mockResolvedValue({
        id: 'restaurant',
        name: existing?.name ?? 'Chez Flash',
        setupCompleted: true,
      });
      tx.user.create.mockResolvedValue(CREATED_ROOT);
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));
      return tx;
    }

    it('crée le compte racine avec le rôle super_admin et un mot de passe haché', async () => {
      const tx = stubTransaction();

      const result = await service.complete(VALID_PAYLOAD);

      expect(result.superAdmin.role).toBe('super_admin');
      const userData = tx.user.create.mock.calls[0][0].data;
      expect(userData.role).toBe('super_admin');
      expect(userData.password).not.toBe('StrongPassword123!');
      expect(userData.password).toMatch(/^\$2[aby]\$/);
      expect(userData.emailVerified).toBe(true);
    });

    it('ne sème aucune ligne de permissions pour le compte racine', async () => {
      const tx = stubTransaction();

      await service.complete(VALID_PAYLOAD);

      const seeded = tx.rolePermission.createMany.mock.calls[0][0].data;
      expect(seeded.map((row: { role: string }) => row.role)).not.toContain(
        'super_admin',
      );
      expect(seeded).not.toHaveLength(0);
    });

    it('ferme le garde sans attendre une relecture de la base', async () => {
      stubTransaction();
      prisma.restaurant.findUnique.mockResolvedValue(null);

      await service.complete(VALID_PAYLOAD);

      await expect(state.isCompleted()).resolves.toBe(true);
      expect(prisma.restaurant.findUnique).not.toHaveBeenCalled();
    });

    it("consigne l'installation dans la piste d'audit", async () => {
      stubTransaction();

      await service.complete(VALID_PAYLOAD, {
        ip: '10.0.0.1',
        userAgent: 'jest',
        requestId: 'req-1',
      });

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'setup.complete',
          entity: 'Restaurant',
          userId: 'root-1',
          userRole: 'super_admin',
          ip: '10.0.0.1',
          requestId: 'req-1',
        }),
      );
    });

    describe('reprise après perte du compte racine', () => {
      const EXISTING = {
        id: 'restaurant',
        name: 'Chez Flash',
        setupCompleted: true,
      };

      it("ne retouche pas la configuration de l'établissement", async () => {
        const tx = stubTransaction(EXISTING);

        const result = await service.complete({
          superAdmin: VALID_PAYLOAD.superAdmin,
        } as CompleteSetupDto);

        expect(result.isRecovery).toBe(true);
        expect(tx.restaurant.create).not.toHaveBeenCalled();
        expect(tx.restaurant.update).not.toHaveBeenCalled();
      });

      it('ne rejoue ni les permissions, ni les horaires, ni la carte', async () => {
        const tx = stubTransaction(EXISTING);

        await service.complete({
          superAdmin: VALID_PAYLOAD.superAdmin,
          menu: [{ name: 'Entrées', items: [] }],
        } as CompleteSetupDto);

        expect(tx.rolePermission.createMany).not.toHaveBeenCalled();
        expect(tx.openingHours.createMany).not.toHaveBeenCalled();
        expect(tx.menuCategory.create).not.toHaveBeenCalled();
      });

      it("consigne une action d'audit distincte", async () => {
        stubTransaction(EXISTING);

        await service.complete({
          superAdmin: VALID_PAYLOAD.superAdmin,
        } as CompleteSetupDto);

        expect(audit.record).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'setup.recover' }),
        );
      });

      it("relève le drapeau d'installation s'il manquait", async () => {
        const tx = stubTransaction({ ...EXISTING, setupCompleted: false });

        await service.complete({
          superAdmin: VALID_PAYLOAD.superAdmin,
        } as CompleteSetupDto);

        expect(tx.restaurant.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ setupCompleted: true }),
          }),
        );
      });
    });

    it("refuse une première installation sans les informations de l'établissement", async () => {
      stubTransaction();

      await expect(
        service.complete({
          superAdmin: VALID_PAYLOAD.superAdmin,
        } as CompleteSetupDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('distingue un email déjà pris d’un logiciel déjà installé', async () => {
      prisma.$transaction.mockRejectedValue(uniqueViolation(['email']));

      await expect(service.complete(VALID_PAYLOAD)).rejects.toThrow(
        /adresse email/i,
      );
      // Un email en collision ne prouve pas que l'installation est faite.
      expect(prisma.restaurant.findUnique).not.toHaveBeenCalled();
    });

    it('traduit le second compte racine en 409 et referme le garde', async () => {
      prisma.$transaction.mockRejectedValue(
        uniqueViolation(['User_single_super_admin_key']),
      );

      await expect(service.complete(VALID_PAYLOAD)).rejects.toThrow(
        ConflictException,
      );
      await expect(state.isCompleted()).resolves.toBe(true);
    });

    it('rejette une seconde soumission concurrente', async () => {
      let release!: () => void;
      prisma.$transaction.mockImplementation(
        () =>
          new Promise((resolve) => {
            release = () =>
              resolve({
                restaurant: { id: 'restaurant', name: 'Chez Flash' },
                superAdmin: CREATED_ROOT,
                isRecovery: false,
              });
          }),
      );

      const first = service.complete(VALID_PAYLOAD);
      // Laisse la première requête franchir bcrypt (volontairement lent) et
      // atteindre la transaction, sans parier sur une durée fixe.
      while (!release) await new Promise((r) => setTimeout(r, 10));

      await expect(service.complete(VALID_PAYLOAD)).rejects.toThrow(
        ConflictException,
      );

      release();
      await expect(first).resolves.toBeDefined();
    });

    it('libère le verrou après un échec, pour autoriser une nouvelle tentative', async () => {
      prisma.$transaction.mockRejectedValue(new Error('base indisponible'));

      await expect(service.complete(VALID_PAYLOAD)).rejects.toThrow();

      stubTransaction();
      await expect(service.complete(VALID_PAYLOAD)).resolves.toBeDefined();
    });
  });
});
