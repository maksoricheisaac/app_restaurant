import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanLimitService } from '../plans/plans.service';
import { TenantRole } from '../common/constants/tenant-roles.constant';

@Injectable()
export class MembershipsService {
  constructor(
    private prisma: PrismaService,
    private planLimitService: PlanLimitService,
  ) {}

  async findByTenant(tenantId: string) {
    return this.prisma.tenantMembership.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.tenantMembership.findMany({
      where: { userId },
      include: { tenant: true },
    });
  }

  async invite(tenantId: string, email: string, role: string) {
    await this.planLimitService.assertStaffMemberLimit(tenantId);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return this.prisma.tenantMembership.create({
      data: {
        tenantId,
        userId: user.id,
        role,
      },
    });
  }

  async updateRole(
    id: string,
    tenantId: string,
    role: string,
    currentUserId: string,
  ) {
    // Verify membership belongs to caller's tenant before updating (IDOR prevention)
    const membership = await this.prisma.tenantMembership.findFirst({
      where: { id, tenantId },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    if (membership.userId === currentUserId) {
      throw new ForbiddenException(
        'You cannot change the role of your own membership through this endpoint',
      );
    }

    if (membership.role === TenantRole.OWNER) {
      throw new ForbiddenException(
        'The tenant owner role can only change via the ownership transfer flow',
      );
    }

    return this.prisma.tenantMembership.update({
      where: { id },
      data: { role },
    });
  }

  async remove(id: string, tenantId: string, currentUserId: string) {
    // Verify membership belongs to caller's tenant before deleting (IDOR prevention)
    const membership = await this.prisma.tenantMembership.findFirst({
      where: { id, tenantId },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    if (membership.userId === currentUserId) {
      throw new ForbiddenException(
        'You cannot remove your own membership through this endpoint',
      );
    }

    if (membership.role === TenantRole.OWNER) {
      throw new ForbiddenException(
        'The tenant owner cannot be removed via membership management',
      );
    }

    return this.prisma.tenantMembership.delete({
      where: { id },
    });
  }

  /**
   * Transfers tenant ownership from the current owner to another member,
   * atomically: the current owner is demoted to "manager" and the target
   * member is promoted to "owner". This is the only way "owner" can be
   * assigned, keeping exactly one owner per tenant at all times.
   */
  async transferOwnership(
    tenantId: string,
    currentUserId: string,
    targetMembershipId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const currentOwnerMembership = await tx.tenantMembership.findFirst({
        where: { tenantId, userId: currentUserId, role: TenantRole.OWNER },
      });
      if (!currentOwnerMembership) {
        throw new ForbiddenException(
          'Only the current tenant owner can transfer ownership',
        );
      }

      const targetMembership = await tx.tenantMembership.findFirst({
        where: { id: targetMembershipId, tenantId },
      });
      if (!targetMembership) {
        throw new NotFoundException('Target membership not found');
      }

      if (targetMembership.id === currentOwnerMembership.id) {
        throw new ConflictException('You are already the tenant owner');
      }

      await tx.tenantMembership.update({
        where: { id: currentOwnerMembership.id },
        data: { role: TenantRole.MANAGER },
      });

      return tx.tenantMembership.update({
        where: { id: targetMembership.id },
        data: { role: TenantRole.OWNER },
      });
    });
  }
}
