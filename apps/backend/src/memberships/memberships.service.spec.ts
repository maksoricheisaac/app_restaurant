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
const mockMailService = {
  sendMembershipInvite: jest.fn().mockResolvedValue(undefined),
};
const mockConfig = {
  get: jest.fn().mockReturnValue('http://localhost:4000'),
};

describe('MembershipsService', () => {
  let service: MembershipsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new MembershipsService(
      prisma as any,
      mockPlanLimitService as any,
      mockMailService as any,
      mockConfig as any,
    );
    jest.clearAllMocks();
    mockPlanLimitService.assertStaffMemberLimit.mockResolvedValue(undefined);
    mockMailService.sendMembershipInvite.mockResolvedValue(undefined);
    mockConfig.get.mockReturnValue('http://localhost:4000');
    prisma.tenant.findUnique.mockResolvedValue({ name: 'Le Maquis' });
  });

  // ─── invite ───────────────────────────────────────────────────────────────

  describe('invite — existing user (fast path)', () => {
    it('creates a membership immediately for an existing user', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'u1', email: 'alice@test.com' }) // by email
        .mockResolvedValueOnce({ name: 'Bob Inviter' }); // inviter lookup
      prisma.tenantMembership.findUnique.mockResolvedValue(null); // not already a member
      prisma.tenantMembership.create.mockResolvedValue({ id: 'm1' });

      await service.invite(
        'tenant-1',
        'inviter-1',
        'alice@test.com',
        'manager',
      );

      expect(mockPlanLimitService.assertStaffMemberLimit).toHaveBeenCalledWith(
        'tenant-1',
      );
      expect(prisma.tenantMembership.create).toHaveBeenCalledWith({
        data: { tenantId: 'tenant-1', userId: 'u1', role: 'manager' },
      });
    });

    it('sends a notification email to the existing user', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'u1', email: 'alice@test.com' })
        .mockResolvedValueOnce({ name: 'Bob Inviter' });
      prisma.tenantMembership.findUnique.mockResolvedValue(null);
      prisma.tenantMembership.create.mockResolvedValue({ id: 'm1' });

      await service.invite(
        'tenant-1',
        'inviter-1',
        'alice@test.com',
        'manager',
      );

      expect(mockMailService.sendMembershipInvite).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'alice@test.com', role: 'manager' }),
      );
    });

    it('throws ConflictException when the user is already a member', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'u1', email: 'alice@test.com' })
        .mockResolvedValueOnce({ name: 'Bob Inviter' });
      prisma.tenantMembership.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.invite('tenant-1', 'inviter-1', 'alice@test.com', 'manager'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.tenantMembership.create).not.toHaveBeenCalled();
    });
  });

  describe('invite — no existing account (token invite)', () => {
    it('creates a MembershipInvite with a hashed token and 7-day expiry', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // no user with this email
        .mockResolvedValueOnce({ name: 'Bob Inviter' });
      prisma.membershipInvite.findFirst.mockResolvedValue(null); // no pending invite yet
      prisma.membershipInvite.create.mockResolvedValue({
        id: 'invite-1',
        email: 'nobody@test.com',
        status: 'pending',
      });

      await service.invite(
        'tenant-1',
        'inviter-1',
        'nobody@test.com',
        'waiter',
      );

      const call = prisma.membershipInvite.create.mock.calls[0][0];
      expect(call.data.tenantId).toBe('tenant-1');
      expect(call.data.email).toBe('nobody@test.com');
      expect(call.data.role).toBe('waiter');
      expect(call.data.invitedBy).toBe('inviter-1');
      expect(call.data.tokenHash).toHaveLength(64); // sha256 hex
      expect(call.data.expiresAt.getTime()).toBeGreaterThan(Date.now());
      // Le hash ne doit jamais être renvoyé au client
      expect(call.select?.tokenHash).toBeUndefined();
    });

    it('sends an invite email with an accept link containing the raw token', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ name: 'Bob Inviter' });
      prisma.membershipInvite.findFirst.mockResolvedValue(null);
      prisma.membershipInvite.create.mockResolvedValue({ id: 'invite-1' });

      await service.invite(
        'tenant-1',
        'inviter-1',
        'nobody@test.com',
        'waiter',
      );

      const call = mockMailService.sendMembershipInvite.mock.calls[0][0];
      expect(call.to).toBe('nobody@test.com');
      expect(call.acceptUrl).toMatch(
        /^http:\/\/localhost:4000\/invite\/accept\/[a-f0-9]{64}$/,
      );
    });

    it('throws ConflictException when a pending invite already exists for this email', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ name: 'Bob Inviter' });
      prisma.membershipInvite.findFirst.mockResolvedValue({
        id: 'existing-invite',
      });

      await expect(
        service.invite('tenant-1', 'inviter-1', 'nobody@test.com', 'waiter'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.membershipInvite.create).not.toHaveBeenCalled();
    });
  });

  describe('listInvites / revokeInvite / resendInvite', () => {
    it('lists only pending invites for the tenant', async () => {
      prisma.membershipInvite.findMany.mockResolvedValue([]);

      await service.listInvites('tenant-1');

      const call = prisma.membershipInvite.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ tenantId: 'tenant-1', status: 'pending' });
    });

    it('revokeInvite throws NotFoundException when invite does not belong to tenant', async () => {
      prisma.membershipInvite.findFirst.mockResolvedValue(null);
      await expect(
        service.revokeInvite('tenant-1', 'invite-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('revokeInvite throws ConflictException when invite is not pending', async () => {
      prisma.membershipInvite.findFirst.mockResolvedValue({
        id: 'invite-1',
        status: 'accepted',
      });
      await expect(
        service.revokeInvite('tenant-1', 'invite-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('revokeInvite sets status to revoked', async () => {
      prisma.membershipInvite.findFirst.mockResolvedValue({
        id: 'invite-1',
        status: 'pending',
      });
      prisma.membershipInvite.update.mockResolvedValue({
        id: 'invite-1',
        status: 'revoked',
      });

      await service.revokeInvite('tenant-1', 'invite-1');

      expect(prisma.membershipInvite.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'invite-1' },
          data: { status: 'revoked' },
        }),
      );
    });

    it('resendInvite rotates the token and re-sends the email', async () => {
      prisma.membershipInvite.findFirst.mockResolvedValue({
        id: 'invite-1',
        status: 'pending',
        email: 'nobody@test.com',
        role: 'waiter',
        invitedBy: 'inviter-1',
      });
      prisma.user.findUnique.mockResolvedValue({ name: 'Bob Inviter' });
      prisma.membershipInvite.update.mockResolvedValue({ id: 'invite-1' });

      await service.resendInvite('tenant-1', 'invite-1');

      expect(prisma.membershipInvite.update).toHaveBeenCalled();
      const updateCall = prisma.membershipInvite.update.mock.calls[0][0];
      expect(updateCall.data.tokenHash).toHaveLength(64);
      expect(mockMailService.sendMembershipInvite).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'nobody@test.com' }),
      );
    });
  });

  describe('getInvitePreview', () => {
    it('throws NotFoundException for an unknown token', async () => {
      prisma.membershipInvite.findUnique.mockResolvedValue(null);
      await expect(service.getInvitePreview('bad-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('reports valid=true for a pending, non-expired invite', async () => {
      prisma.membershipInvite.findUnique.mockResolvedValue({
        email: 'a@test.com',
        role: 'waiter',
        status: 'pending',
        expiresAt: new Date(Date.now() + 60_000),
        tenant: { name: 'Le Maquis', logo: null },
      });

      const result = await service.getInvitePreview('good-token');
      expect(result.valid).toBe(true);
      expect(result.status).toBe('pending');
    });

    it('reports valid=false and status=expired for an expired pending invite', async () => {
      prisma.membershipInvite.findUnique.mockResolvedValue({
        email: 'a@test.com',
        role: 'waiter',
        status: 'pending',
        expiresAt: new Date(Date.now() - 60_000),
        tenant: { name: 'Le Maquis', logo: null },
      });

      const result = await service.getInvitePreview('expired-token');
      expect(result.valid).toBe(false);
      expect(result.status).toBe('expired');
    });
  });

  describe('acceptInvite', () => {
    beforeEach(() => {
      prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
    });

    it('throws NotFoundException for an unknown token', async () => {
      prisma.membershipInvite.findUnique.mockResolvedValue(null);
      await expect(
        service.acceptInvite('bad-token', 'user-1', 'a@test.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when invite is not pending', async () => {
      prisma.membershipInvite.findUnique.mockResolvedValue({
        id: 'invite-1',
        status: 'revoked',
        email: 'a@test.com',
        expiresAt: new Date(Date.now() + 60_000),
      });
      await expect(
        service.acceptInvite('token', 'user-1', 'a@test.com'),
      ).rejects.toThrow(ConflictException);
    });

    it('marks the invite expired and throws when past expiresAt', async () => {
      prisma.membershipInvite.findUnique.mockResolvedValue({
        id: 'invite-1',
        status: 'pending',
        email: 'a@test.com',
        expiresAt: new Date(Date.now() - 60_000),
      });
      prisma.membershipInvite.update.mockResolvedValue({});

      await expect(
        service.acceptInvite('token', 'user-1', 'a@test.com'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.membershipInvite.update).toHaveBeenCalledWith({
        where: { id: 'invite-1' },
        data: { status: 'expired' },
      });
    });

    it('throws ForbiddenException when the accepting email does not match the invite', async () => {
      prisma.membershipInvite.findUnique.mockResolvedValue({
        id: 'invite-1',
        status: 'pending',
        email: 'a@test.com',
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.acceptInvite('token', 'user-1', 'someone-else@test.com'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates the membership and marks the invite accepted', async () => {
      prisma.membershipInvite.findUnique.mockResolvedValue({
        id: 'invite-1',
        tenantId: 'tenant-1',
        status: 'pending',
        email: 'a@test.com',
        role: 'waiter',
        expiresAt: new Date(Date.now() + 60_000),
      });
      prisma.tenantMembership.findUnique.mockResolvedValue(null);
      prisma.tenantMembership.create.mockResolvedValue({
        id: 'm1',
        role: 'waiter',
      });
      prisma.membershipInvite.update.mockResolvedValue({});

      const result = await service.acceptInvite(
        'token',
        'user-1',
        'a@test.com',
      );

      expect(prisma.tenantMembership.create).toHaveBeenCalledWith({
        data: { tenantId: 'tenant-1', userId: 'user-1', role: 'waiter' },
      });
      expect(prisma.membershipInvite.update).toHaveBeenCalledWith({
        where: { id: 'invite-1' },
        data: { status: 'accepted', acceptedAt: expect.any(Date) },
      });
      expect(result).toEqual({ id: 'm1', role: 'waiter' });
    });

    it('is case-insensitive when matching the invite email', async () => {
      prisma.membershipInvite.findUnique.mockResolvedValue({
        id: 'invite-1',
        tenantId: 'tenant-1',
        status: 'pending',
        email: 'Alice@Test.com',
        role: 'waiter',
        expiresAt: new Date(Date.now() + 60_000),
      });
      prisma.tenantMembership.findUnique.mockResolvedValue(null);
      prisma.tenantMembership.create.mockResolvedValue({ id: 'm1' });
      prisma.membershipInvite.update.mockResolvedValue({});

      await expect(
        service.acceptInvite('token', 'user-1', 'alice@test.com'),
      ).resolves.toBeDefined();
    });
  });

  describe('declineInvite', () => {
    it('marks the invite declined when email matches', async () => {
      prisma.membershipInvite.findUnique.mockResolvedValue({
        id: 'invite-1',
        status: 'pending',
        email: 'a@test.com',
      });
      prisma.membershipInvite.update.mockResolvedValue({
        id: 'invite-1',
        status: 'declined',
      });

      await service.declineInvite('token', 'a@test.com');

      expect(prisma.membershipInvite.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'invite-1' },
          data: { status: 'declined' },
        }),
      );
    });

    it('throws ForbiddenException on email mismatch', async () => {
      prisma.membershipInvite.findUnique.mockResolvedValue({
        id: 'invite-1',
        status: 'pending',
        email: 'a@test.com',
      });

      await expect(
        service.declineInvite('token', 'someone-else@test.com'),
      ).rejects.toThrow(ForbiddenException);
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
        .mockResolvedValueOnce({
          id: 'm-owner',
          userId: 'owner-user',
          role: 'owner',
        })
        .mockResolvedValueOnce(null); // target not found

      await expect(
        service.transferOwnership('tenant-1', 'owner-user', 'm-target'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when target is already the owner', async () => {
      const ownerMembership = {
        id: 'm-owner',
        userId: 'owner-user',
        role: 'owner',
      };
      prisma.tenantMembership.findFirst
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(ownerMembership);

      await expect(
        service.transferOwnership('tenant-1', 'owner-user', 'm-owner'),
      ).rejects.toThrow(ConflictException);
    });

    it('demotes the current owner to manager and promotes the target to owner', async () => {
      const ownerMembership = {
        id: 'm-owner',
        userId: 'owner-user',
        role: 'owner',
      };
      const targetMembership = {
        id: 'm-target',
        userId: 'u2',
        role: 'manager',
      };

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
