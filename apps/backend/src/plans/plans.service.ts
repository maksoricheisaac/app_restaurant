import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getLimitsForPlan, PlanFeatures, UNLIMITED } from './plans.config';

@Injectable()
export class PlanLimitService {
  private readonly logger = new Logger(PlanLimitService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Internal helpers ────────────────────────────────────────────────────

  private async getTenantPlan(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, status: true },
    });
    if (!tenant) throw new ForbiddenException('Tenant introuvable');
    // Suspended tenants are treated as free for limit purposes
    if (tenant.status === 'suspended' || tenant.status === 'expired') {
      return 'free';
    }
    return String(tenant.plan);
  }

  private startOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  // ─── Limit checks (throw ForbiddenException on exceeded quota) ───────────

  async assertMenuItemLimit(tenantId: string): Promise<void> {
    const plan = await this.getTenantPlan(tenantId);
    const limits = getLimitsForPlan(plan);
    if (limits.maxMenuItems >= UNLIMITED) return;

    const count = await this.prisma.menuItem.count({
      where: { tenantId, deletedAt: null },
    });

    if (count >= limits.maxMenuItems) {
      throw new ForbiddenException(
        `Votre plan ${plan.toUpperCase()} est limité à ${limits.maxMenuItems} articles de menu. Passez à un plan supérieur pour en ajouter davantage.`,
      );
    }
  }

  async assertTableLimit(tenantId: string): Promise<void> {
    const plan = await this.getTenantPlan(tenantId);
    const limits = getLimitsForPlan(plan);
    if (limits.maxTables >= UNLIMITED) return;

    const count = await this.prisma.table.count({
      where: { tenantId, deletedAt: null },
    });

    if (count >= limits.maxTables) {
      throw new ForbiddenException(
        `Votre plan ${plan.toUpperCase()} est limité à ${limits.maxTables} tables. Passez à un plan supérieur pour en ajouter davantage.`,
      );
    }
  }

  async assertStaffMemberLimit(tenantId: string): Promise<void> {
    const plan = await this.getTenantPlan(tenantId);
    const limits = getLimitsForPlan(plan);
    if (limits.maxStaffMembers >= UNLIMITED) return;

    // Owners are excluded from the staff quota — they always exist and are not
    // "invited" staff members. Only manager/waiter/head_chef/chef/cashier count.
    const count = await this.prisma.tenantMembership.count({
      where: { tenantId, role: { not: 'owner' } },
    });

    if (count >= limits.maxStaffMembers) {
      throw new ForbiddenException(
        `Votre plan ${plan.toUpperCase()} est limité à ${limits.maxStaffMembers} membres d'équipe (hors propriétaire). Passez à un plan supérieur pour en inviter davantage.`,
      );
    }
  }

  async assertMonthlyOrderLimit(tenantId: string): Promise<void> {
    const plan = await this.getTenantPlan(tenantId);
    const limits = getLimitsForPlan(plan);
    if (limits.maxMonthlyOrders >= UNLIMITED) return;

    const count = await this.prisma.order.count({
      where: {
        tenantId,
        deletedAt: null,
        createdAt: { gte: this.startOfCurrentMonth() },
      },
    });

    if (count >= limits.maxMonthlyOrders) {
      throw new ForbiddenException(
        `Votre plan ${plan.toUpperCase()} est limité à ${limits.maxMonthlyOrders} commandes par mois. Passez à un plan supérieur pour continuer à accepter des commandes.`,
      );
    }
  }

  async assertFeatureAccess(
    tenantId: string,
    feature: keyof PlanFeatures,
  ): Promise<void> {
    const plan = await this.getTenantPlan(tenantId);
    const limits = getLimitsForPlan(plan);

    if (!limits.features[feature]) {
      throw new ForbiddenException(
        `La fonctionnalité "${feature}" n'est pas disponible sur votre plan ${plan.toUpperCase()}. Veuillez upgrader votre abonnement.`,
      );
    }
  }

  // ─── Usage summary (for dashboard / UI) ─────────────────────────────────

  async getUsageSummary(tenantId: string) {
    const plan = await this.getTenantPlan(tenantId);
    const limits = getLimitsForPlan(plan);

    const [menuItems, tables, staff, monthlyOrders] = await Promise.all([
      this.prisma.menuItem.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.table.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.tenantMembership.count({
        where: { tenantId, role: { not: 'owner' } },
      }),
      this.prisma.order.count({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: { gte: this.startOfCurrentMonth() },
        },
      }),
    ]);

    const fmt = (val: number) => (val >= UNLIMITED ? null : val);

    return {
      plan,
      usage: {
        menuItems: { current: menuItems, max: fmt(limits.maxMenuItems) },
        tables: { current: tables, max: fmt(limits.maxTables) },
        staff: { current: staff, max: fmt(limits.maxStaffMembers) },
        monthlyOrders: {
          current: monthlyOrders,
          max: fmt(limits.maxMonthlyOrders),
        },
      },
      features: limits.features,
    };
  }
}
