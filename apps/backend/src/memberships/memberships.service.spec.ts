import {
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const mockPlanLimitService = {
  assertStaffMemberLimit: jest.fn().mockResolvedValue(undefined),
};

describe('MembershipsService', () => {
  let service: MembershipsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new MembershipsService(prisma as any, mockPlanLimitService as any);
    jest.clearAllMocks();
    mockPlanLimitService.assertStaffMemberLimit.mockResolvedValue(undefined);
  });

  // ─── invite ───────────────────────────────────────────────────────────────

  describe('invite', () => {
    it('throws NotFoundException when invited user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.invite('tenant-1', 'nobody@test.com', 'waiter'),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a membership for an existing user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.tenantMembership.create.mockResolvedValue({ id: 'm1' });

      await service.invite('tenant-1', 'alice@test.com', 'manager');

      expect(mockPlanLimitService.assertStaffMemberLimit).toHaveBeenCalledWith(
        'tenant-1',
      );
      expect(prisma.tenantMembership.create).toHaveBeenCalledWith({
        data: { tenantId: 'tenant-1', userId: 'u1', role: 'manager' },
      });
    });
  });

  // ─── updateRole ───────────────────────────────────────────────────────────

  describe('updateRole', () => {
    it('throws NotFoundException when membership not found', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue(null);

      await expect(
        service.updateRole('m1', 'tenant-1', 'manager', 'current-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when changing own role', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue({
        id: 'm1',
        userId: 'current-user',
        role: 'manager',
      });

      await expect(
        service.updateRole('m1', 'tenant-1', 'waiter', 'current-user'),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.tenantMembership.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when target membership is the tenant owner', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue({
        id: 'm1',
        userId: 'owner-user',
        role: 'owner',
      });

      await expect(
        service.updateRole('m1', 'tenant-1', 'manager', 'current-user'),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.tenantMembership.update).not.toHaveBeenCalled();
    });

    it('updates the role for a non-owner, non-self member', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue({
        id: 'm1',
        userId: 'u1',
        role: 'waiter',
      });
      prisma.tenantMembership.update.mockResolvedValue({
        id: 'm1',
        role: 'manager',
      });

      const result = await service.updateRole(
        'm1',
        'tenant-1',
        'manager',
        'current-user',
      );

      expect(prisma.tenantMembership.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: { role: 'manager' },
      });
      expect(result).toEqual({ id: 'm1', role: 'manager' });
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('throws NotFoundException when membership not found', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('m1', 'tenant-1', 'current-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when removing own membership', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue({
        id: 'm1',
        userId: 'current-user',
        role: 'manager',
      });

      await expect(
        service.remove('m1', 'tenant-1', 'current-user'),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.tenantMembership.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when removing the tenant owner', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue({
        id: 'm1',
        userId: 'owner-user',
        role: 'owner',
      });

      await expect(
        service.remove('m1', 'tenant-1', 'current-user'),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.tenantMembership.delete).not.toHaveBeenCalled();
    });

    it('deletes a non-owner, non-self membership', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue({
        id: 'm1',
        userId: 'u1',
        role: 'waiter',
      });
      prisma.tenantMembership.delete.mockResolvedValue({ id: 'm1' });

      await service.remove('m1', 'tenant-1', 'current-user');

      expect(prisma.tenantMembership.delete).toHaveBeenCalledWith({
        where: { id: 'm1' },
      });
    });
  });

  // ─── transferOwnership ───────────────────────────────────────────────────

  describe('transferOwnership', () => {
    beforeEach(() => {
      // Run the transaction callback against the same mocked prisma instance
      // so per-test mocks on `prisma.tenantMembership.*` are visible to `tx`.
      prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
    });

    it('throws ForbiddenException when caller is not the current owner', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValueOnce(null); // no owner membership for caller

      await expect(
        service.transferOwnership('tenant-1', 'not-owner', 'm-target'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when target membership does not exist', async () => {
      prisma.tenantMembership.findFirst
        .mockResolvedValueOnce({ id: 'm-owner', userId: 'owner-user', role: 'owner' })
        .mockResolvedValueOnce(null); // target not found

      await expect(
        service.transferOwnership('tenant-1', 'owner-user', 'm-target'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when target is already the owner', async () => {
      const ownerMembership = { id: 'm-owner', userId: 'owner-user', role: 'owner' };
      prisma.tenantMembership.findFirst
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(ownerMembership);

      await expect(
        service.transferOwnership('tenant-1', 'owner-user', 'm-owner'),
      ).rejects.toThrow(ConflictException);
    });

    it('demotes the current owner to manager and promotes the target to owner', async () => {
      const ownerMembership = { id: 'm-owner', userId: 'owner-user', role: 'owner' };
      const targetMembership = { id: 'm-target', userId: 'u2', role: 'manager' };

      prisma.tenantMembership.findFirst
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(targetMembership);
      prisma.tenantMembership.update.mockResolvedValue({
        id: 'm-target',
        role: 'owner',
      });

      const result = await service.transferOwnership(
        'tenant-1',
        'owner-user',
        'm-target',
      );

      expect(prisma.tenantMembership.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'm-owner' },
        data: { role: 'manager' },
      });
      expect(prisma.tenantMembership.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'm-target' },
        data: { role: 'owner' },
      });
      expect(result).toEqual({ id: 'm-target', role: 'owner' });
    });
  });
});
