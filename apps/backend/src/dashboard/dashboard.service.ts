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

    const [ordersCount, revenue, reservationsCount, activeCustomers] =
      await Promise.all([
        this.prisma.order.count({
          where: { tenantId, createdAt: { gte: start, lte: end } },
        }),
        this.prisma.order.aggregate({
          where: {
            tenantId,
            createdAt: { gte: start, lte: end },
            status: { not: 'cancelled' },
          },
          _sum: { total: true },
        }),
        this.prisma.reservation.count({
          where: { tenantId, date: { gte: start, lte: end } },
        }),
        this.prisma.customer.count({
          where: {
            tenantId,
            orders: { some: { createdAt: { gte: start, lte: end } } },
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
      where: { tenantId },
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
        categories: 0,
        menus: 0,
        orders: 0,
        reservations: 0,
        tables: 0,
        customers: 0,
      };
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required for non-super-admin users');
    }

    const [categories, menus, orders, reservations, tables, customers] =
      await Promise.all([
        this.prisma.menuCategory.count({ where: { tenantId } }),
        this.prisma.menuItem.count({ where: { tenantId } }),
        this.prisma.order.count({ where: { tenantId } }),
        this.prisma.reservation.count({ where: { tenantId } }),
        this.prisma.table.count({ where: { tenantId } }),
        this.prisma.customer.count({ where: { tenantId } }),
      ]);

    return {
      categories,
      menus,
      orders,
      reservations,
      tables,
      customers,
    };
  }

  async getPlatformStats() {
    const [totalTenants, totalUsers, totalOrders, platformRevenue] = await Promise.all([
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
