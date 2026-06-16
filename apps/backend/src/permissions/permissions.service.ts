import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanLimitService } from '../plans/plans.service';
import * as bcrypt from 'bcrypt';
import {
  CreateStaffDto,
  UpdateStaffDto,
  UpdateRolePermissionsDto,
} from './dto/permissions.dto';
import { TenantRole } from '../common/constants/tenant-roles.constant';

@Injectable()
export class PermissionsService {
  constructor(
    private prisma: PrismaService,
    private planLimitService: PlanLimitService,
  ) {}

  async getPersonnel(tenantId: string) {
    return this.prisma.tenantMembership.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createStaff(tenantId: string, data: CreateStaffDto) {
    await this.planLimitService.assertStaffMemberLimit(tenantId);

    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      const membership = await this.prisma.tenantMembership.findUnique({
        where: { userId_tenantId: { userId: existing.id, tenantId } },
      });
      if (membership)
        throw new ConflictException('User already in this tenant');

      return this.prisma.tenantMembership.create({
        data: { tenantId, userId: existing.id, role: data.role },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        tenantId,
        emailVerified: true, // Admin-created staff bypass email verification
      },
    });

    return this.prisma.tenantMembership.create({
      data: { tenantId, userId: user.id, role: data.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async updateStaff(
    tenantId: string,
    membershipId: string,
    data: UpdateStaffDto,
    currentUserId: string,
  ) {
    const membership = await this.prisma.tenantMembership.findFirst({
      where: { id: membershipId, tenantId },
    });
    if (!membership) throw new NotFoundException('Staff member not found');

    if (membership.userId === currentUserId) {
      throw new ForbiddenException(
        'You cannot modify your own membership through this endpoint',
      );
    }

    if (membership.role === TenantRole.OWNER) {
      throw new ForbiddenException(
        'The tenant owner role can only change via the ownership transfer flow',
      );
    }

    const { role, ...userFields } = data;

    if (role) {
      await this.prisma.tenantMembership.update({
        where: { id: membershipId },
        data: { role },
      });
    }

    if (Object.keys(userFields).length > 0) {
      await this.prisma.user.update({
        where: { id: membership.userId },
        data: userFields as any,
      });
    }

    return this.prisma.tenantMembership.findFirst({
      where: { id: membershipId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
    });
  }

  async deleteStaff(tenantId: string, membershipId: string, currentUserId: string) {
    const membership = await this.prisma.tenantMembership.findFirst({
      where: { id: membershipId, tenantId },
    });
    if (!membership) throw new NotFoundException('Staff member not found');

    if (membership.userId === currentUserId) {
      throw new ForbiddenException(
        'You cannot remove your own membership through this endpoint',
      );
    }

    if (membership.role === TenantRole.OWNER) {
      throw new ForbiddenException(
        'The tenant owner cannot be removed via staff management',
      );
    }

    return this.prisma.tenantMembership.delete({ where: { id: membershipId } });
  }

  async getRolePermissions(tenantId: string, role: string) {
    const rp = await this.prisma.rolePermission.findUnique({
      where: { tenantId_role: { tenantId, role } },
    });
    return rp ?? { tenantId, role, permissions: [] };
  }

  async updateRolePermissions(
    tenantId: string,
    role: string,
    data: UpdateRolePermissionsDto,
  ) {
    return this.prisma.rolePermission.upsert({
      where: { tenantId_role: { tenantId, role } },
      update: { permissions: data.permissions as any },
      create: { tenantId, role, permissions: data.permissions as any },
    });
  }
}
