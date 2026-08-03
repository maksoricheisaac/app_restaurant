import { NotFoundException, ConflictException } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const mockAuditService = { recordDetached: jest.fn(), record: jest.fn() };

describe('CashRegisterService', () => {
  let service: CashRegisterService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new CashRegisterService(prisma as any, mockAuditService as any);
    jest.clearAllMocks();
  });

  // ─── processPayment ─────────────────────────────────────────────────────

  describe('processPayment', () => {
    it('throws NotFoundException when order does not exist', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.processPayment({
          orderId: 'order-1',
          amount: 10,
          method: 'cash' as any,
          cashierId: 'cashier-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('attaches the currently open cash session to the payment', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'order-1',
        total: 10,
        status: 'ready',
      });
      prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
      prisma.cashRegisterSession.findFirst.mockResolvedValue({
        id: 'session-1',
      });
      prisma.payment.create.mockResolvedValue({ id: 'payment-1' });

      await service.processPayment({
        orderId: 'order-1',
        amount: 10,
        method: 'cash' as any,
        cashierId: 'cashier-1',
      });

      const call = prisma.payment.create.mock.calls[0][0];
      expect(call.data.cashSessionId).toBe('session-1');
    });

    it('leaves cashSessionId null when no session is open', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'order-1',
        total: 10,
        status: 'ready',
      });
      prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
      prisma.cashRegisterSession.findFirst.mockResolvedValue(null);
      prisma.payment.create.mockResolvedValue({ id: 'payment-1' });

      await service.processPayment({
        orderId: 'order-1',
        amount: 10,
        method: 'card' as any,
        cashierId: 'cashier-1',
      });

      const call = prisma.payment.create.mock.calls[0][0];
      expect(call.data.cashSessionId).toBeNull();
    });
  });

  // ─── Session lifecycle ──────────────────────────────────────────────────

  describe('openSession', () => {
    it('creates a session when none is currently open', async () => {
      prisma.cashRegisterSession.findFirst.mockResolvedValue(null);
      prisma.cashRegisterSession.create.mockResolvedValue({
        id: 'session-1',
        status: 'open',
      });

      const result = await service.openSession('user-1', {
        openingAmount: 50,
      });

      expect(result.id).toBe('session-1');
      const call = prisma.cashRegisterSession.create.mock.calls[0][0];
      expect(call.data).toMatchObject({
        openedBy: 'user-1',
        openingAmount: 50,
      });
    });

    it('throws ConflictException when a session is already open', async () => {
      prisma.cashRegisterSession.findFirst.mockResolvedValue({
        id: 'existing-session',
      });

      await expect(
        service.openSession('user-1', { openingAmount: 50 }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.cashRegisterSession.create).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentSession', () => {
    it('returns null when no session is open', async () => {
      prisma.cashRegisterSession.findFirst.mockResolvedValue(null);
      expect(await service.getCurrentSession()).toBeNull();
    });
  });

  describe('closeSession', () => {
    it('throws NotFoundException when no session is open', async () => {
      prisma.cashRegisterSession.findFirst.mockResolvedValue(null);

      await expect(
        service.closeSession('user-1', { closingAmount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('computes expectedAmount = openingAmount + cash payments of the session', async () => {
      prisma.cashRegisterSession.findFirst.mockResolvedValue({
        id: 'session-1',
        openingAmount: 50,
        notes: null,
      });
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 200 } });
      prisma.cashRegisterSession.update.mockResolvedValue({
        id: 'session-1',
        status: 'closed',
      });

      await service.closeSession('user-1', { closingAmount: 250 });

      const aggCall = prisma.payment.aggregate.mock.calls[0][0];
      expect(aggCall.where).toEqual({
        cashSessionId: 'session-1',
        method: 'cash',
      });

      const updateCall = prisma.cashRegisterSession.update.mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: 'session-1' });
      expect(updateCall.data.status).toBe('closed');
      expect(updateCall.data.closedBy).toBe('user-1');
      expect(updateCall.data.expectedAmount).toBe(250); // 50 + 200
      expect(updateCall.data.variance).toBe(0); // 250 counted - 250 expected
    });

    it('reports a shortfall as negative variance', async () => {
      prisma.cashRegisterSession.findFirst.mockResolvedValue({
        id: 'session-1',
        openingAmount: 50,
        notes: null,
      });
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 200 } });
      prisma.cashRegisterSession.update.mockResolvedValue({});

      await service.closeSession('user-1', { closingAmount: 230 });

      const updateCall = prisma.cashRegisterSession.update.mock.calls[0][0];
      expect(updateCall.data.variance).toBe(-20); // 230 - 250
    });

    it('handles a session with zero cash payments (no aggregate rows)', async () => {
      prisma.cashRegisterSession.findFirst.mockResolvedValue({
        id: 'session-1',
        openingAmount: 50,
        notes: null,
      });
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });
      prisma.cashRegisterSession.update.mockResolvedValue({});

      await service.closeSession('user-1', { closingAmount: 50 });

      const updateCall = prisma.cashRegisterSession.update.mock.calls[0][0];
      expect(updateCall.data.expectedAmount).toBe(50);
      expect(updateCall.data.variance).toBe(0);
    });
  });

  describe('getSessionHistory', () => {
    it('returns paginated closed sessions ordered by closedAt desc', async () => {
      prisma.cashRegisterSession.findMany.mockResolvedValue([{ id: 's1' }]);
      prisma.cashRegisterSession.count.mockResolvedValue(1);

      const result = await service.getSessionHistory();

      const call = prisma.cashRegisterSession.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ status: 'closed' });
      expect(call.orderBy).toEqual({ closedAt: 'desc' });
      expect(result.data).toEqual([{ id: 's1' }]);
    });
  });

  // ─── getTransactions ────────────────────────────────────────────────────

  describe('getTransactions', () => {
    it('applies pagination params', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(45);

      await service.getTransactions({ page: 2, limit: 10 } as any);

      const call = prisma.transaction.findMany.mock.calls[0][0];
      expect(call.skip).toBe(10);
      expect(call.take).toBe(10);
    });

    it('filters by type and cashierId when provided', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(0);

      await service.getTransactions({
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

      await service.getUnpaidOrders();

      const call = prisma.order.findMany.mock.calls[0][0];
      expect(call.where.status).toEqual({ in: ['ready', 'served'] });
      expect(call.where.payment).toBeNull();
    });
  });
});
