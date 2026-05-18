import { ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

const mockPlanLimitService = {
  assertStaffMemberLimit: jest.fn().mockResolvedValue(undefined),
};

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new PermissionsService(prisma as any, mockPlanLimitService as any);
    jest.clearAllMocks();
    mockPlanLimitService.assertStaffMemberLimit.mockResolvedValue(undefined);
  });

  // ─── createStaff — plan limit enforcement ─────────────────────────────────

  describe('createStaff — plan limit enforcement', () => {
    it('calls assertStaffMemberLimit before creating staff', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // new user
      prisma.user.create.mockResolvedValue({ id: 'u1', name: 'Alice', email: 'alice@test.com' });
      prisma.tenantMembership.create.mockResolvedValue({
        id: 'm1',
        user: { id: 'u1', name: 'Alice', email: 'alice@test.com' },
      });

      await service.createStaff('tenant-1', {
        name: 'Alice',
        email: 'alice@test.com',
        password: 'Password@123',
        role: 'waiter',
      } as any);

      expect(mockPlanLimitService.assertStaffMemberLimit).toHaveBeenCalledWith('tenant-1');
    });

    it('does NOT create staff when quota is exceeded', async () => {
      mockPlanLimitService.assertStaffMemberLimit.mockRejectedValue(
        new ForbiddenException('Limite staff atteinte'),
      );

      await expect(
        service.createStaff('tenant-1', {
          name: 'Bob',
          email: 'bob@test.com',
          password: 'Password@123',
          role: 'chef',
        } as any),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.tenantMembership.create).not.toHaveBeenCalled();
    });

    it('calls assertStaffMemberLimit even when user already exists (re-invite path)', async () => {
      mockPlanLimitService.assertStaffMemberLimit.mockRejectedValue(
        new ForbiddenException('Limite atteinte'),
      );
      // If limit service throws, we should not proceed to user lookup
      await expect(
        service.createStaff('tenant-1', {
          name: 'Existing',
          email: 'existing@test.com',
          password: 'Password@123',
          role: 'waiter',
        } as any),
      ).rejects.toThrow(ForbiddenException);

      // Should never reach DB
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  // ─── createStaff — existing user re-invite ────────────────────────────────

  describe('createStaff — existing user paths', () => {
    it('links existing user to tenant if not already a member', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-u1' });
      prisma.tenantMembership.findUnique.mockResolvedValue(null); // not yet a member
      prisma.tenantMembership.create.mockResolvedValue({
        id: 'm1',
        user: { id: 'existing-u1', name: 'Existing', email: 'ex@test.com' },
      });

      await service.createStaff('tenant-1', {
        name: 'Existing',
        email: 'ex@test.com',
        password: 'irrelevant',
        role: 'manager',
      } as any);

      // Should NOT create a new user account
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.tenantMembership.create).toHaveBeenCalled();
    });

    it('throws ConflictException if user already a member of this tenant', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.tenantMembership.findUnique.mockResolvedValue({ id: 'm1' }); // already member

      await expect(
        service.createStaff('tenant-1', {
          name: 'Already',
          email: 'already@test.com',
          password: 'Password@123',
          role: 'waiter',
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── updateStaff ──────────────────────────────────────────────────────────

  describe('updateStaff', () => {
    it('throws NotFoundException when membership not found', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStaff('tenant-1', 'unknown-membership', { role: 'waiter' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── deleteStaff ──────────────────────────────────────────────────────────

  describe('deleteStaff', () => {
    it('deletes membership when found', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue({ id: 'm1', userId: 'u1' });
      prisma.tenantMembership.delete.mockResolvedValue({ id: 'm1' });

      await service.deleteStaff('tenant-1', 'm1');

      expect(prisma.tenantMembership.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    });

    it('throws NotFoundException when membership not found', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue(null);
      await expect(service.deleteStaff('tenant-1', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });
});
