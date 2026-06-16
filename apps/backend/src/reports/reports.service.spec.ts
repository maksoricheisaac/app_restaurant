import { ReportsService } from './reports.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const T = 'tenant-1';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ReportsService(prisma as any);
    jest.clearAllMocks();
  });

  // ─── getMetrics ───────────────────────────────────────────────────────────

  describe('getMetrics', () => {
    it('aggregates orders, revenue, customers and reservations', async () => {
      prisma.order.groupBy = jest.fn().mockResolvedValue([
        { status: 'served', _count: { id: 5 } },
        { status: 'cancelled', _count: { id: 1 } },
      ]);
      prisma.transaction.aggregate = jest
        .fn()
        .mockResolvedValue({ _sum: { amount: 200 }, _count: { id: 5 } });
      prisma.customer.count.mockResolvedValue(3);
      prisma.reservation = { count: jest.fn().mockResolvedValue(2) } as any;

      const result = await service.getMetrics(T, 'monthly');

      expect(result.orders.total).toBe(6);
      expect(result.orders.byStatus).toEqual({ served: 5, cancelled: 1 });
      expect(result.revenue.total).toBe(200);
      expect(result.revenue.transactionCount).toBe(5);
      expect(result.revenue.averageOrderValue).toBe(40);
      expect(result.customers.new).toBe(3);
      expect(result.reservations.total).toBe(2);
    });

    it('excludes soft-deleted orders and reservations from the date filters', async () => {
      prisma.order.groupBy = jest.fn().mockResolvedValue([]);
      prisma.transaction.aggregate = jest
        .fn()
        .mockResolvedValue({ _sum: { amount: null }, _count: { id: 0 } });
      prisma.customer.count.mockResolvedValue(0);
      prisma.reservation = { count: jest.fn().mockResolvedValue(0) } as any;

      await service.getMetrics(T, 'monthly');

      const orderCall = prisma.order.groupBy.mock.calls[0][0];
      expect(orderCall.where.deletedAt).toBeNull();

      const reservationCall = (prisma.reservation as any).count.mock
        .calls[0][0];
      expect(reservationCall.where.deletedAt).toBeNull();
    });
  });

  // ─── getChartData ─────────────────────────────────────────────────────────

  describe('getChartData', () => {
    it('merges per-day revenue and order counts from SQL aggregation', async () => {
      prisma.$queryRaw
        .mockResolvedValueOnce([
          { day: new Date('2026-06-01T00:00:00.000Z'), total: 150 },
          { day: new Date('2026-06-02T00:00:00.000Z'), total: 50 },
        ])
        .mockResolvedValueOnce([
          { day: new Date('2026-06-01T00:00:00.000Z'), count: 3 },
          { day: new Date('2026-06-03T00:00:00.000Z'), count: 1 },
        ]);

      const result = await service.getChartData(T, 'monthly', '2026-06-15');

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
      expect(result.labels).toEqual([
        '2026-06-01',
        '2026-06-02',
        '2026-06-03',
      ]);
      expect(result.revenue).toEqual([150, 50, 0]);
      expect(result.orders).toEqual([3, 0, 1]);
    });

    it('returns empty series when there is no activity in the period', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await service.getChartData(T, 'monthly', '2026-06-15');

      expect(result.labels).toEqual([]);
      expect(result.revenue).toEqual([]);
      expect(result.orders).toEqual([]);
    });
  });
});
