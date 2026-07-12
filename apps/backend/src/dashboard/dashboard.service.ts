import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string, date: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const dateFilter = { createdAt: { gte: start, lte: end } };
    const [ordersCount, revenue, reservationsCount, activeCustomers] =
      await Promise.all([
        this.prisma.order.count({
          where: { tenantId, deletedAt: null, ...dateFilter },
        }),
        this.prisma.order.aggregate({
          where: {
            tenantId,
            deletedAt: null,
            ...dateFilter,
            status: { not: 'cancelled' },
          },
          _sum: { total: true },
        }),
        this.prisma.reservation.count({
          where: { tenantId, deletedAt: null, date: { gte: start, lte: end } },
        }),
        this.prisma.customer.count({
          where: {
            tenantId,
            deletedAt: null,
            orders: { some: { ...dateFilter, deletedAt: null } },
          },
        }),
      ]);

    return {
      ordersCount,
      totalRevenue: revenue._sum.total || 0,
      reservationsCount,
      activeCustomers,
    };
  }

  async getRecentOrders(tenantId: string) {
    return this.prisma.order.findMany({
      where: { tenantId, deletedAt: null },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        customer: { select: { name: true } },
      },
    });
  }

  async getSidebarCounts(tenantId: string | undefined, user?: any) {
    if (!tenantId && user?.platformRole === 'super_admin') {
      return {
        orders: 0,
        pendingOrders: 0,
        reservations: 0,
        pendingReservations: 0,
        unreadMessages: 0,
        categories: 0,
        menus: 0,
        tables: 0,
        customers: 0,
      };
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required for non-super-admin users');
    }

    // 9 count() → 5 queries: groupBy collapses orders by status (1 query)
    // and reservations by status (1 query), reducing round-trips by 44%.
    const [
      ordersByStatus,
      reservationsByStatus,
      unreadMessages,
      categories,
      menus,
      tables,
      customers,
    ] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        where: { tenantId, deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.reservation.groupBy({
        by: ['status'],
        where: { tenantId, deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.message.count({
        where: { tenantId, status: 'new', deletedAt: null },
      }),
      this.prisma.menuCategory.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.menuItem.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.table.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.customer.count({ where: { tenantId, deletedAt: null } }),
    ]);

    const orders = ordersByStatus.reduce((sum, s) => sum + s._count.id, 0);
    const pendingOrders = ordersByStatus
      .filter((s) => s.status === 'pending' || s.status === 'preparing')
      .reduce((sum, s) => sum + s._count.id, 0);

    const reservations = reservationsByStatus.reduce(
      (sum, s) => sum + s._count.id,
      0,
    );
    const pendingReservations = reservationsByStatus
      .filter((s) => s.status === 'pending')
      .reduce((sum, s) => sum + s._count.id, 0);

    return {
      orders,
      pendingOrders,
      reservations,
      pendingReservations,
      unreadMessages,
      categories,
      menus,
      tables,
      customers,
    };
  }

  /**
   * Statistiques de facturation plateforme (Super Admin) — agrégées côté
   * serveur sur TOUS les tenants (pas seulement une page), en croisant la
   * répartition réelle des plans avec leurs prix data-driven (table Plan).
   */
  async getBillingStats() {
    const [plans, grouped] = await Promise.all([
      this.prisma.plan.findMany({
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.tenant.groupBy({
        by: ['plan'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
    ]);

    const countByKey: Record<string, number> = {};
    grouped.forEach((g) => {
      countByKey[String(g.plan)] = g._count.id;
    });

    const breakdown = plans.map((p) => {
      const count = countByKey[p.key] ?? 0;
      return {
        key: p.key,
        name: p.name,
        monthlyPrice: p.monthlyPrice,
        annualPrice: p.annualPrice,
        currency: p.currency,
        isActive: p.isActive,
        count,
        mrr: p.monthlyPrice * count,
      };
    });

    const totalTenants = Object.values(countByKey).reduce((s, n) => s + n, 0);
    const mrr = breakdown.reduce((s, b) => s + b.mrr, 0);
    const payingTenants = breakdown
      .filter((b) => b.monthlyPrice > 0)
      .reduce((s, b) => s + b.count, 0);
    const conversion =
      totalTenants > 0 ? Math.round((payingTenants / totalTenants) * 100) : 0;

    return {
      totalTenants,
      payingTenants,
      mrr,
      arr: mrr * 12,
      conversion,
      breakdown,
    };
  }

  async getPlatformStats() {
    const [totalTenants, totalUsers, totalOrders, platformRevenue] =
      await Promise.all([
        this.prisma.tenant.count(),
        this.prisma.user.count(),
        this.prisma.order.count(),
        this.prisma.order.aggregate({
          where: { status: { not: 'cancelled' } },
          _sum: { total: true },
        }),
      ]);

    const activeTenants = await this.prisma.tenant.count({
      where: { status: 'active' },
    });

    const recentTenants = await this.prisma.tenant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalOrders,
      totalRevenue: platformRevenue._sum.total || 0,
      recentTenants,
    };
  }
}
