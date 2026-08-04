import { ForbiddenException } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { PermissionsService } from './permissions.service';
import { StaffRole } from '../common/constants/staff-roles.constant';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const ALL_PERMISSIONS = Object.values(Permission);

describe('PermissionsService', () => {
  let prisma: MockPrisma;
  let service: PermissionsService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new PermissionsService(prisma as any);
  });

  describe('compte racine', () => {
    it("n'apparaît pas dans le catalogue configurable", () => {
      const roles = service.getCatalog().roles.map((r) => r.key);
      expect(roles).not.toContain(StaffRole.SUPER_ADMIN);
      expect(roles).toContain(StaffRole.OWNER);
    });

    it('a toutes les permissions, sans lecture en base', async () => {
      const result = await service.getRolePermissions(StaffRole.SUPER_ADMIN);

      expect(result.permissions).toEqual(ALL_PERMISSIONS);
      expect(prisma.rolePermission.findUnique).not.toHaveBeenCalled();
    });

    it('garde toutes ses permissions même si la table dit le contraire', async () => {
      prisma.rolePermission.findUnique.mockResolvedValue({
        role: StaffRole.SUPER_ADMIN,
        permissions: [Permission.VIEW_DASHBOARD],
      });

      const result = await service.getRolePermissions(StaffRole.SUPER_ADMIN);

      expect(result.permissions).toEqual(ALL_PERMISSIONS);
    });

    it('refuse toute modification de ses permissions de rôle', () => {
      expect(() =>
        service.updateRolePermissions(StaffRole.SUPER_ADMIN, {
          permissions: [Permission.VIEW_DASHBOARD],
        }),
      ).toThrow(ForbiddenException);
      expect(prisma.rolePermission.upsert).not.toHaveBeenCalled();
    });

    it('refuse la remise aux valeurs d’usine', () => {
      expect(() =>
        service.resetRolePermissions(StaffRole.SUPER_ADMIN),
      ).toThrow(ForbiddenException);
    });

    it('refuse toute dérogation individuelle', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'root-1',
        role: StaffRole.SUPER_ADMIN,
      });

      await expect(
        service.setUserPermission('root-1', {
          permission: Permission.VIEW_DASHBOARD,
          granted: false,
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.userPermission.upsert).not.toHaveBeenCalled();
    });

    it('ignore les dérogations déjà en base au calcul des droits effectifs', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'root-1',
        name: 'Root',
        role: StaffRole.SUPER_ADMIN,
      });
      prisma.userPermission.findMany.mockResolvedValue([
        { permission: Permission.VIEW_DASHBOARD, granted: false },
      ]);

      const result = await service.getUserPermissions('root-1');

      expect(result.effective).toEqual(ALL_PERMISSIONS);
      expect(result.overrides).toEqual([]);
    });
  });

  describe('rôles ordinaires', () => {
    it('reste configurable', () => {
      service.updateRolePermissions(StaffRole.MANAGER, {
        permissions: [Permission.VIEW_DASHBOARD],
      });

      expect(prisma.rolePermission.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: StaffRole.MANAGER } }),
      );
    });

    it('applique les dérogations individuelles', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        name: 'Ana',
        role: StaffRole.WAITER,
      });
      prisma.rolePermission.findUnique.mockResolvedValue({
        role: StaffRole.WAITER,
        permissions: [Permission.VIEW_ORDERS],
      });
      prisma.userPermission.findMany.mockResolvedValue([
        { permission: Permission.VIEW_REPORTS, granted: true },
        { permission: Permission.VIEW_ORDERS, granted: false },
      ]);

      const result = await service.getUserPermissions('u1');

      expect(result.effective).toEqual([Permission.VIEW_REPORTS]);
    });
  });
});
