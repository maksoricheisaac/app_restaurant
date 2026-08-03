import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(date: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const dateFilter = { createdAt: { gte: start, lte: end } };
    const [ordersCount, revenue, reservationsCount, activeCustomers] =
      await Promise.all([
        this.prisma.order.count({
          where: { deletedAt: null, ...dateFilter },
        }),
        this.prisma.order.aggregate({
          where: {
            deletedAt: null,
            ...dateFilter,
            status: { not: 'cancelled' },
          },
          _sum: { total: true },
        }),
        this.prisma.reservation.count({
          where: { deletedAt: null, date: { gte: start, lte: end } },
        }),
        this.prisma.customer.count({
          where: {
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

  async getRecentOrders() {
    return this.prisma.order.findMany({
      where: { deletedAt: null },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        customer: { select: { name: true } },
      },
    });
  }

  async getSidebarCounts() {
    // 9 count() → 7 requêtes : les groupBy replient les commandes et les
    // réservations par statut en une requête chacun.
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
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.reservation.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.message.count({
        where: { status: 'new', deletedAt: null },
      }),
      this.prisma.menuCategory.count({ where: { deletedAt: null } }),
      this.prisma.menuItem.count({ where: { deletedAt: null } }),
      this.prisma.table.count({ where: { deletedAt: null } }),
      this.prisma.customer.count({ where: { deletedAt: null } }),
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
}
