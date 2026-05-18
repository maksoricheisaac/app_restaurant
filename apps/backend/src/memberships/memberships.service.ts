import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanLimitService } from '../plans/plans.service';

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

  async updateRole(id: string, tenantId: string, role: string) {
    // Verify membership belongs to caller's tenant before updating (IDOR prevention)
    const membership = await this.prisma.tenantMembership.findFirst({
      where: { id, tenantId },
    });
    if (!membership) throw new NotFoundException('Membership not found');
    return this.prisma.tenantMembership.update({
      where: { id },
      data: { role },
    });
  }

  async remove(id: string, tenantId: string) {
    // Verify membership belongs to caller's tenant before deleting (IDOR prevention)
    const membership = await this.prisma.tenantMembership.findFirst({
      where: { id, tenantId },
    });
    if (!membership) throw new NotFoundException('Membership not found');
    return this.prisma.tenantMembership.delete({
      where: { id },
    });
  }
}
