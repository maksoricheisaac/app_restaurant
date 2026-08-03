import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RevenueService } from '../common/revenue/revenue.service';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private revenue: RevenueService,
  ) {}

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

  async getMetrics(type: ReportPeriod = 'monthly', date?: string) {
    const { start, end } = this.getDateRange(type, date);
    const dateFilter = { createdAt: { gte: start, lte: end } };
    const orderWhere = { deletedAt: null, ...dateFilter };
    const reservationWhere = { deletedAt: null, ...dateFilter };

    const [ordersStats, revenue, newCustomers, reservationsCount] =
      await Promise.all([
        this.prisma.order.groupBy({
          by: ['status'],
          where: orderWhere,
          _count: { id: true },
        }),
        // Source unique du CA, partagée avec le tableau de bord. Sommer
        // `Transaction.amount` comme auparavant comptait l'argent tendu par
        // le client, monnaie rendue comprise — donc surévaluait les ventes
        // dès qu'un règlement en espèces n'était pas fait à l'appoint.
        this.revenue.compute({ start, end }),
        this.prisma.customer.count({
          where: { deletedAt: null, ...dateFilter },
        }),
        this.prisma.reservation.count({ where: reservationWhere }),
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
        collected: revenue.collected,
        ordered: revenue.ordered,
        outstanding: revenue.outstanding,
        paidOrderCount: revenue.collectedCount,
        averageTicket: revenue.averageTicket,
      },
      customers: { new: newCustomers },
      reservations: { total: reservationsCount },
    };
  }

  async getChartData(type: ReportPeriod = 'monthly', date?: string) {
    const { start, end } = this.getDateRange(type, date);

    const [revenueRows, orderRows] = await Promise.all([
      // Même définition que `RevenueBreakdown.collected` : le total dû des
      // commandes effectivement réglées, et non la somme des espèces tendues.
      this.prisma.$queryRaw<{ day: Date; total: number }[]>`
        SELECT date_trunc('day', o."createdAt") AS day,
               COALESCE(SUM(o."total"), 0)::float8 AS total
        FROM "Order" o
        JOIN "Payment" p ON p."orderId" = o."id" AND p."status" = 'completed'
        WHERE o."deletedAt" IS NULL
          AND o."status" <> 'cancelled'
          AND o."createdAt" BETWEEN ${start} AND ${end}
        GROUP BY day
        ORDER BY day ASC
      `,
      this.prisma.$queryRaw<{ day: Date; count: number }[]>`
        SELECT date_trunc('day', "createdAt") AS day,
               COUNT(*)::int AS count
        FROM "Order"
        WHERE "deletedAt" IS NULL
          AND "createdAt" BETWEEN ${start} AND ${end}
        GROUP BY day
        ORDER BY day ASC
      `,
    ]);

    const dayKey = (d: Date) => d.toISOString().split('T')[0];
    const revenueByDay = new Map(
      revenueRows.map((r) => [dayKey(r.day), Number(r.total)]),
    );
    const ordersByDay = new Map(
      orderRows.map((r) => [dayKey(r.day), Number(r.count)]),
    );

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
