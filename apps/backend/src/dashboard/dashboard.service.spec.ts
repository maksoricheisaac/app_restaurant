import { DashboardService } from './dashboard.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const EMPTY_REVENUE = {
  ordered: 0,
  orderedCount: 0,
  collected: 0,
  collectedCount: 0,
  outstanding: 0,
  averageTicket: 0,
};

const mockRevenueService = {
  compute: jest.fn().mockResolvedValue(EMPTY_REVENUE),
};

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new DashboardService(prisma as any, mockRevenueService as any);
    jest.clearAllMocks();
    mockRevenueService.compute.mockResolvedValue(EMPTY_REVENUE);
    prisma.order.count.mockResolvedValue(0);
    prisma.order.findMany.mockResolvedValue([]);
    prisma.reservation = {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    } as any;
    prisma.customer.count.mockResolvedValue(0);
  });

  // ─── getStats ─────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('returns daily stats with all counters', async () => {
      prisma.order.count.mockResolvedValueOnce(12);
      mockRevenueService.compute.mockResolvedValue({
        ...EMPTY_REVENUE,
        ordered: 45000,
        collected: 30000,
        outstanding: 15000,
      });
      (prisma.reservation as any).count.mockResolvedValueOnce(3);
      prisma.customer.count.mockResolvedValueOnce(8);

      const result = await service.getStats('2026-05-17');

      expect(result.ordersCount).toBe(12);
      expect(result.reservationsCount).toBe(3);
      expect(result.activeCustomers).toBe(8);
      // Encaissé et commandé sont distincts et nommés : c'est ce qui manquait
      // à l'ancien `totalRevenue`, que les rapports calculaient autrement.
      expect(result.revenueCollected).toBe(30000);
      expect(result.revenueOrdered).toBe(45000);
      expect(result.revenueOutstanding).toBe(15000);
    });

    it('lit le chiffre d’affaires par la source partagée, sur la journée demandée', async () => {
      await service.getStats('2026-05-17');

      const { start, end } = mockRevenueService.compute.mock.calls[0][0];
      expect(start.getHours()).toBe(0);
      expect(end.getHours()).toBe(23);
    });

    it('filters orders for the specific day (start/end of day)', async () => {
      await service.getStats('2026-05-17');

      const orderCountCall = prisma.order.count.mock.calls[0][0];
      expect(orderCountCall.where.createdAt.gte).toBeInstanceOf(Date);
      expect(orderCountCall.where.createdAt.lte).toBeInstanceOf(Date);

      const start = orderCountCall.where.createdAt.gte;
      const end = orderCountCall.where.createdAt.lte;
      expect(start.getHours()).toBe(0);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
    });

    it('returns 0 revenue when there is no activity', async () => {
      const result = await service.getStats('2026-05-17');

      expect(result.revenueCollected).toBe(0);
      expect(result.revenueOrdered).toBe(0);
      expect(result.revenueOutstanding).toBe(0);
    });

    it('executes all 4 queries in parallel', async () => {
      // All mocks should be called once
      await service.getStats('2026-05-17');

      expect(prisma.order.count).toHaveBeenCalledTimes(1);
      expect(mockRevenueService.compute).toHaveBeenCalledTimes(1);
      expect((prisma.reservation as any).count).toHaveBeenCalledTimes(1);
      expect(prisma.customer.count).toHaveBeenCalledTimes(1);
    });
  });

  // ─── getRecentOrders ──────────────────────────────────────────────────────

  describe('getRecentOrders', () => {
    it('returns at most 5 most recent orders', async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.getRecentOrders();

      const call = prisma.order.findMany.mock.calls[0][0];
      expect(call.take).toBe(5);
      expect(call.orderBy).toEqual({ createdAt: 'desc' });
    });
  });
});
