import { NotFoundException } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const T = 'tenant-1';

describe('CashRegisterService', () => {
  let service: CashRegisterService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new CashRegisterService(prisma as any);
    jest.clearAllMocks();
  });

  // ─── processPayment ─────────────────────────────────────────────────────

  describe('processPayment', () => {
    it('throws NotFoundException when order does not exist', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.processPayment(T, {
          orderId: 'order-1',
          amount: 10,
          method: 'cash' as any,
          cashierId: 'cashier-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getTransactions ────────────────────────────────────────────────────

  describe('getTransactions', () => {
    it('queries transactions for tenant with default pagination', async () => {
      const tx = { id: 'tx-1', tenantId: T, type: 'sale', amount: 10 };
      prisma.transaction.findMany.mockResolvedValue([tx]);
      prisma.transaction.count.mockResolvedValue(1);

      const result = await service.getTransactions(T, {} as any);

      const call = prisma.transaction.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.orderBy).toEqual({ createdAt: 'desc' });
      expect(result.data).toEqual([tx]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      });
    });

    it('applies pagination params', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(45);

      await service.getTransactions(T, { page: 2, limit: 10 } as any);

      const call = prisma.transaction.findMany.mock.calls[0][0];
      expect(call.skip).toBe(10);
      expect(call.take).toBe(10);
    });

    it('filters by type and cashierId when provided', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(0);

      await service.getTransactions(T, {
        type: 'refund',
        cashierId: 'cashier-1',
      } as any);

      const call = prisma.transaction.findMany.mock.calls[0][0];
      expect(call.where.type).toBe('refund');
      expect(call.where.cashierId).toBe('cashier-1');
    });
  });

  // ─── getUnpaidOrders ─────────────────────────────────────────────────────

  describe('getUnpaidOrders', () => {
    it('queries ready/served orders without payment', async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.getUnpaidOrders(T);

      const call = prisma.order.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.where.status).toEqual({ in: ['ready', 'served'] });
      expect(call.where.payment).toBeNull();
    });
  });
});
