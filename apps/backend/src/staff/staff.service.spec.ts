import { ConfigService } from '@nestjs/config';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { StaffService } from './staff.service';
import { MailService } from '../mail/mail.service';
import { RestaurantService } from '../restaurant/restaurant.service';
import { StaffRole } from '../common/constants/staff-roles.constant';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const ROOT = {
  id: 'root-1',
  name: 'Riche Makso',
  email: 'admin@example.com',
  role: StaffRole.SUPER_ADMIN,
  status: 'active',
};

const OWNER = {
  id: 'owner-1',
  name: 'Ana',
  email: 'ana@example.com',
  role: StaffRole.OWNER,
  status: 'active',
};

const MANAGER = {
  id: 'manager-1',
  name: 'Bo',
  email: 'bo@example.com',
  role: StaffRole.MANAGER,
  status: 'active',
};

describe('StaffService — protection du compte racine', () => {
  let prisma: MockPrisma;
  let service: StaffService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new StaffService(
      prisma as any,
      {} as MailService,
      {} as RestaurantService,
      { get: () => 'http://localhost:4000' } as unknown as ConfigService,
    );
  });

  describe('modification et suppression', () => {
    it('refuse de modifier le super administrateur', async () => {
      prisma.user.findUnique.mockResolvedValue(ROOT);

      await expect(
        service.update(ROOT.id, { name: 'Usurpateur' }, MANAGER.id),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('refuse de le supprimer', async () => {
      prisma.user.findUnique.mockResolvedValue(ROOT);

      await expect(service.remove(ROOT.id, MANAGER.id)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.user.delete).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('refuse aussi de le désactiver par le chemin « historique financier »', async () => {
      prisma.user.findUnique.mockResolvedValue(ROOT);
      prisma.payment.count.mockResolvedValue(42);

      await expect(service.remove(ROOT.id, MANAGER.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('attribution de la propriété', () => {
    function stubTransaction(users: Record<string, unknown>[]) {
      const tx = createMockPrisma();
      tx.user.findUnique.mockImplementation(({ where }: any) =>
        Promise.resolve(users.find((u: any) => u.id === where.id) ?? null),
      );
      tx.user.findFirst.mockImplementation(({ where }: any) =>
        Promise.resolve(users.find((u: any) => u.role === where.role) ?? null),
      );
      tx.user.update.mockImplementation(({ where, data }: any) =>
        Promise.resolve({ id: where.id, ...data }),
      );
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));
      return tx;
    }

    it('laisse le compte racine désigner un propriétaire sans se rétrograder', async () => {
      const tx = stubTransaction([ROOT, MANAGER]);

      const result = await service.transferOwnership(ROOT.id, MANAGER.id);

      expect(result.role).toBe(StaffRole.OWNER);
      // Le compte racine n'est pas touché : il désigne, il ne cède rien.
      const updatedIds = tx.user.update.mock.calls.map(
        (call: any) => call[0].where.id,
      );
      expect(updatedIds).not.toContain(ROOT.id);
    });

    it('rétrograde le propriétaire sortant, même désigné par le compte racine', async () => {
      const tx = stubTransaction([ROOT, OWNER, MANAGER]);

      await service.transferOwnership(ROOT.id, MANAGER.id);

      expect(tx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: OWNER.id },
          data: { role: StaffRole.MANAGER },
        }),
      );
    });

    it('rétrograde le propriétaire quand c’est lui qui transfère', async () => {
      const tx = stubTransaction([OWNER, MANAGER]);

      await service.transferOwnership(OWNER.id, MANAGER.id);

      expect(tx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: OWNER.id },
          data: { role: StaffRole.MANAGER },
        }),
      );
    });

    it('refuse de faire du compte racine un propriétaire', async () => {
      stubTransaction([ROOT, OWNER]);

      await expect(
        service.transferOwnership(OWNER.id, ROOT.id),
      ).rejects.toThrow(ConflictException);
    });

    it('refuse que le compte racine se désigne lui-même', async () => {
      stubTransaction([ROOT]);

      await expect(
        service.transferOwnership(ROOT.id, ROOT.id),
      ).rejects.toThrow(ConflictException);
    });

    it('refuse à un manager de désigner un propriétaire', async () => {
      stubTransaction([MANAGER, OWNER]);

      await expect(
        service.transferOwnership(MANAGER.id, OWNER.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
