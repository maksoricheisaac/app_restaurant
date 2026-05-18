import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(type: ReportPeriod, date?: string) {
    const ref = date ? new Date(date) : new Date();
    ref.setHours(0, 0, 0, 0);

    let start: Date;
    let end: Date;

    switch (type) {
      case 'daily':
        start = new Date(ref);
        end = new Date(ref);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start = new Date(ref);
        start.setDate(ref.getDate() - ref.getDay());
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start = new Date(ref.getFullYear(), ref.getMonth(), 1);
        end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        start = new Date(ref.getFullYear(), 0, 1);
        end = new Date(ref.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }

  async getMetrics(
    tenantId: string,
    type: ReportPeriod = 'monthly',
    date?: string,
  ) {
    const { start, end } = this.getDateRange(type, date);
    const where = { tenantId, createdAt: { gte: start, lte: end } };

    const [
      ordersStats,
      revenue,
      newCustomers,
      reservationsCount,
    ] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'sale' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.customer.count({ where }),
      this.prisma.reservation.count({ where }),
    ]);

    const totalOrders = ordersStats.reduce((acc, s) => acc + s._count.id, 0);
    const ordersByStatus = Object.fromEntries(
      ordersStats.map((s) => [s.status, s._count.id]),
    );

    return {
      period: { type, start, end },
      orders: {
        total: totalOrders,
        byStatus: ordersByStatus,
      },
      revenue: {
        total: Number(revenue._sum?.amount ?? 0),
        transactionCount: revenue._count.id,
        averageOrderValue:
          revenue._count.id > 0
            ? Number(revenue._sum?.amount ?? 0) / revenue._count.id
            : 0,
      },
      customers: { new: newCustomers },
      reservations: { total: reservationsCount },
    };
  }

  async getChartData(
    tenantId: string,
    type: ReportPeriod = 'monthly',
    date?: string,
  ) {
    const { start, end } = this.getDateRange(type, date);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        tenantId,
        type: 'sale',
        createdAt: { gte: start, lte: end },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const orders = await this.prisma.order.findMany({
      where: {
        tenantId,
        createdAt: { gte: start, lte: end },
      },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const revenueByDay = new Map<string, number>();
    const ordersByDay = new Map<string, number>();

    for (const tx of transactions) {
      const key = tx.createdAt.toISOString().split('T')[0];
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(tx.amount));
    }

    for (const order of orders) {
      const key = order.createdAt.toISOString().split('T')[0];
      ordersByDay.set(key, (ordersByDay.get(key) ?? 0) + 1);
    }

    const labels = Array.from(
      new Set([...revenueByDay.keys(), ...ordersByDay.keys()]),
    ).sort();

    return {
      period: { type, start, end },
      labels,
      revenue: labels.map((l) => revenueByDay.get(l) ?? 0),
      orders: labels.map((l) => ordersByDay.get(l) ?? 0),
    };
  }
}
