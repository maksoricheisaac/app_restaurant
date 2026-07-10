import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';
import { OrderType } from './dto/create-order.dto';

const mockEventsService = { emitToTenant: jest.fn(), emitToRoom: jest.fn() };
const mockPlanLimitService = {
  assertMonthlyOrderLimit: jest.fn().mockResolvedValue(undefined),
};
const mockCustomersService = {
  upsertFromInteraction: jest.fn().mockResolvedValue(null),
};
const mockInventoryService = {
  decrementStockForOrder: jest.fn().mockResolvedValue([]),
};

describe('OrdersService — price injection prevention', () => {
  let service: OrdersService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new OrdersService(
      prisma as any,
      mockEventsService as any,
      mockPlanLimitService as any,
      mockCustomersService as any,
      mockInventoryService as any,
    );
    jest.clearAllMocks();
    mockInventoryService.decrementStockForOrder.mockResolvedValue([]);
    // create() écrit désormais dans une transaction — router tx vers le
    // même mock que celui utilisé dans les assertions.
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
    mockPlanLimitService.assertMonthlyOrderLimit.mockResolvedValue(undefined);
  });

  describe('create — price re-fetch from DB', () => {
    const baseOrderData = {
      type: OrderType.DINE_IN,
      items: [
        {
          menuItemId: 'menu-1',
          name: 'Yassa poulet',
          quantity: 2,
          price: 0.01, // attacker sends 1 centime
          image: null,
        },
      ],
    };

    it('uses DB price, NOT client-supplied price when menuItemId is provided', async () => {
      prisma.menuItem.findMany.mockResolvedValue([
        { id: 'menu-1', name: 'Yassa poulet', price: 2500, image: null },
      ]);
      prisma.order.create.mockResolvedValue({
        id: 'order-1',
        total: 5000,
        orderItems: [],
        table: null,
      });

      await service.create('tenant-1', baseOrderData as any);

      const createCall = prisma.order.create.mock.calls[0][0];
      const createdItem = createCall.data.orderItems.create[0];

      expect(createdItem.price).toBe(2500); // DB price
      expect(createdItem.price).not.toBe(0.01); // NOT attacker price
    });

    it('calculates total from DB prices, not client prices', async () => {
      prisma.menuItem.findMany.mockResolvedValue([
        { id: 'menu-1', name: 'Yassa poulet', price: 2500, image: null },
      ]);
      prisma.order.create.mockResolvedValue({
        id: 'order-1',
        total: 5000,
        orderItems: [],
        table: null,
      });

      await service.create('tenant-1', baseOrderData as any);

      const createCall = prisma.order.create.mock.calls[0][0];
      // 2 × 2500 = 5000 (not 2 × 0.01 = 0.02)
      expect(createCall.data.total).toBe(5000);
    });

    it('throws BadRequestException for menuItemId from another tenant', async () => {
      // DB returns empty — the item doesn't exist in this tenant
      prisma.menuItem.findMany.mockResolvedValue([]);

      await expect(
        service.create('tenant-1', baseOrderData as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('queries menuItems with tenantId isolation', async () => {
      prisma.menuItem.findMany.mockResolvedValue([
        { id: 'menu-1', name: 'Yassa poulet', price: 2500, image: null },
      ]);
      prisma.order.create.mockResolvedValue({
        id: 'order-1',
        total: 5000,
        orderItems: [],
        table: null,
      });

      await service.create('tenant-1', baseOrderData as any);

      const findCall = prisma.menuItem.findMany.mock.calls[0][0];
      expect(findCall.where.tenantId).toBe('tenant-1');
    });

    it('allows staff-supplied price for custom items (no menuItemId)', async () => {
      const customItemOrder = {
        type: OrderType.DINE_IN,
        items: [
          {
            // No menuItemId — this is a manual item at the POS
            name: 'Article personnalisé',
            quantity: 1,
            price: 1500,
          },
        ],
      };

      prisma.order.create.mockResolvedValue({
        id: 'order-1',
        total: 1500,
        orderItems: [],
        table: null,
      });

      await service.create('tenant-1', customItemOrder as any);

      const createCall = prisma.order.create.mock.calls[0][0];
      expect(createCall.data.orderItems.create[0].price).toBe(1500);
      // No DB lookup for items without menuItemId
      expect(prisma.menuItem.findMany).not.toHaveBeenCalled();
    });

    it('handles mixed items (some with menuItemId, some without)', async () => {
      const mixedOrder = {
        type: OrderType.DINE_IN,
        items: [
          { menuItemId: 'menu-1', name: 'DB item', quantity: 1, price: 0.01 },
          { name: 'Custom item', quantity: 2, price: 800 },
        ],
      };

      prisma.menuItem.findMany.mockResolvedValue([
        { id: 'menu-1', name: 'DB item', price: 3000, image: null },
      ]);
      prisma.order.create.mockResolvedValue({
        id: 'o1',
        total: 4600,
        orderItems: [],
        table: null,
      });

      await service.create('tenant-1', mixedOrder as any);

      const createCall = prisma.order.create.mock.calls[0][0];
      const items = createCall.data.orderItems.create;

      expect(items[0].price).toBe(3000); // DB price
      expect(items[1].price).toBe(800); // staff price (no menuItemId)
      expect(createCall.data.total).toBe(3000 + 1600); // 3000×1 + 800×2
    });
  });

  describe('create — tableId tenant ownership', () => {
    const orderWithTable = {
      type: OrderType.DINE_IN,
      tableId: 'table-1',
      items: [{ menuItemId: 'menu-1', name: 'Item', quantity: 1, price: 1000 }],
    };

    it('rejects a tableId that does not belong to this tenant', async () => {
      prisma.menuItem.findMany.mockResolvedValue([
        { id: 'menu-1', name: 'Item', price: 1000, image: null },
      ]);
      prisma.table.findFirst.mockResolvedValue(null); // foreign/unknown table

      await expect(
        service.create('tenant-1', orderWithTable as any),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it('accepts a tableId that belongs to this tenant', async () => {
      prisma.menuItem.findMany.mockResolvedValue([
        { id: 'menu-1', name: 'Item', price: 1000, image: null },
      ]);
      prisma.table.findFirst.mockResolvedValue({ id: 'table-1' });
      prisma.order.create.mockResolvedValue({
        id: 'o1',
        total: 1000,
        orderItems: [],
        table: { id: 'table-1' },
      });

      await expect(
        service.create('tenant-1', orderWithTable as any),
      ).resolves.toBeDefined();

      const tableCall = prisma.table.findFirst.mock.calls[0][0];
      expect(tableCall.where).toEqual({
        id: 'table-1',
        tenantId: 'tenant-1',
        deletedAt: null,
      });
    });

    it('skips the table check entirely when no tableId is provided', async () => {
      prisma.menuItem.findMany.mockResolvedValue([
        { id: 'menu-1', name: 'Item', price: 1000, image: null },
      ]);
      prisma.order.create.mockResolvedValue({
        id: 'o1',
        total: 1000,
        orderItems: [],
        table: null,
      });

      await service.create('tenant-1', {
        type: OrderType.DINE_IN,
        items: [
          { menuItemId: 'menu-1', name: 'Item', quantity: 1, price: 1000 },
        ],
      } as any);

      expect(prisma.table.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('create — stock decrement', () => {
    it('decrements stock via InventoryService after creating the order', async () => {
      prisma.menuItem.findMany.mockResolvedValue([
        { id: 'menu-1', name: 'Item', price: 1000, image: null },
      ]);
      prisma.order.create.mockResolvedValue({
        id: 'order-77',
        total: 2000,
        orderItems: [],
        table: null,
      });

      await service.create('tenant-1', {
        type: OrderType.DINE_IN,
        items: [
          { menuItemId: 'menu-1', name: 'Item', quantity: 2, price: 1000 },
        ],
      } as any);

      expect(mockInventoryService.decrementStockForOrder).toHaveBeenCalledWith(
        prisma,
        'tenant-1',
        'order-77',
        [{ menuItemId: 'menu-1', quantity: 2 }],
      );
    });

    it('rejects the whole order when stock is insufficient (transaction rolls back)', async () => {
      prisma.menuItem.findMany.mockResolvedValue([
        { id: 'menu-1', name: 'Item', price: 1000, image: null },
      ]);
      prisma.order.create.mockResolvedValue({
        id: 'order-1',
        total: 1000,
        orderItems: [],
        table: null,
      });
      mockInventoryService.decrementStockForOrder.mockRejectedValue(
        new Error('Stock insuffisant'),
      );

      await expect(
        service.create('tenant-1', {
          type: OrderType.DINE_IN,
          items: [
            { menuItemId: 'menu-1', name: 'Item', quantity: 1, price: 1000 },
          ],
        } as any),
      ).rejects.toThrow('Stock insuffisant');
    });

    it('emits a low-stock-alert event for each ingredient returned by InventoryService', async () => {
      prisma.menuItem.findMany.mockResolvedValue([
        { id: 'menu-1', name: 'Item', price: 1000, image: null },
      ]);
      prisma.order.create.mockResolvedValue({
        id: 'order-1',
        total: 1000,
        orderItems: [],
        table: null,
      });
      mockInventoryService.decrementStockForOrder.mockResolvedValue([
        { ingredientId: 'ing-1', name: 'Tomate', stock: 2, minStock: 5 },
      ]);

      await service.create('tenant-1', {
        type: OrderType.DINE_IN,
        items: [
          { menuItemId: 'menu-1', name: 'Item', quantity: 1, price: 1000 },
        ],
      } as any);

      expect(mockEventsService.emitToTenant).toHaveBeenCalledWith(
        'tenant-1',
        'low-stock-alert',
        { ingredientId: 'ing-1', name: 'Tomate', stock: 2, minStock: 5 },
      );
    });
  });

  describe('create — plan limit enforcement', () => {
    it('calls assertMonthlyOrderLimit before creating the order', async () => {
      prisma.menuItem.findMany.mockResolvedValue([
        { id: 'menu-1', name: 'Item', price: 1000, image: null },
      ]);
      prisma.order.create.mockResolvedValue({
        id: 'o1',
        total: 1000,
        orderItems: [],
        table: null,
      });

      await service.create('tenant-1', {
        type: OrderType.DINE_IN,
        items: [
          { menuItemId: 'menu-1', name: 'Item', quantity: 1, price: 1000 },
        ],
      } as any);

      expect(mockPlanLimitService.assertMonthlyOrderLimit).toHaveBeenCalledWith(
        'tenant-1',
      );
    });

    it('does not create order if monthly limit exceeded', async () => {
      mockPlanLimitService.assertMonthlyOrderLimit.mockRejectedValue(
        new Error('Quota dépassé'),
      );

      await expect(
        service.create('tenant-1', {
          type: OrderType.DINE_IN,
          items: [
            { menuItemId: 'menu-1', name: 'Item', quantity: 1, price: 1000 },
          ],
        } as any),
      ).rejects.toThrow('Quota dépassé');

      expect(prisma.order.create).not.toHaveBeenCalled();
    });
  });
});

// ─── updateStatus — state machine ────────────────────────────────────────────

describe('OrdersService — updateStatus state machine', () => {
  let service: OrdersService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new OrdersService(
      prisma as any,
      mockEventsService as any,
      mockPlanLimitService as any,
      mockCustomersService as any,
      mockInventoryService as any,
    );
    jest.clearAllMocks();
    mockInventoryService.decrementStockForOrder.mockResolvedValue([]);
    // create() écrit désormais dans une transaction — router tx vers le
    // même mock que celui utilisé dans les assertions.
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
  });

  const setCurrentStatus = (status: string) => {
    prisma.order.findFirst.mockResolvedValue({ status });
    prisma.order.update.mockResolvedValue({ id: 'o1', status });
  };

  it('allows pending → preparing', async () => {
    setCurrentStatus('pending');
    await expect(
      service.updateStatus('tenant-1', 'o1', { status: 'preparing' } as any),
    ).resolves.toBeDefined();
  });

  it('allows pending → cancelled', async () => {
    setCurrentStatus('pending');
    await expect(
      service.updateStatus('tenant-1', 'o1', { status: 'cancelled' } as any),
    ).resolves.toBeDefined();
  });

  it('allows preparing → ready', async () => {
    setCurrentStatus('preparing');
    await expect(
      service.updateStatus('tenant-1', 'o1', { status: 'ready' } as any),
    ).resolves.toBeDefined();
  });

  it('blocks pending → served (invalid transition)', async () => {
    setCurrentStatus('pending');
    await expect(
      service.updateStatus('tenant-1', 'o1', { status: 'served' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('blocks served → preparing (terminal state)', async () => {
    setCurrentStatus('served');
    await expect(
      service.updateStatus('tenant-1', 'o1', { status: 'preparing' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('blocks cancelled → pending (terminal state)', async () => {
    setCurrentStatus('cancelled');
    await expect(
      service.updateStatus('tenant-1', 'o1', { status: 'pending' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when order not found', async () => {
    prisma.order.findFirst.mockResolvedValue(null);
    await expect(
      service.updateStatus('tenant-1', 'nonexistent', {
        status: 'preparing',
      } as any),
    ).rejects.toThrow(NotFoundException);
  });
});

// ─── remove — soft-delete ─────────────────────────────────────────────────────

describe('OrdersService — remove (soft-delete)', () => {
  let service: OrdersService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new OrdersService(
      prisma as any,
      mockEventsService as any,
      mockPlanLimitService as any,
      mockCustomersService as any,
      mockInventoryService as any,
    );
    jest.clearAllMocks();
    mockInventoryService.decrementStockForOrder.mockResolvedValue([]);
    // create() écrit désormais dans une transaction — router tx vers le
    // même mock que celui utilisé dans les assertions.
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
  });

  it('soft-deletes order (sets deletedAt, does NOT call prisma.order.delete)', async () => {
    prisma.order.update.mockResolvedValue({ id: 'o1', deletedAt: new Date() });

    await service.remove('tenant-1', 'o1');

    expect(prisma.order.delete).not.toHaveBeenCalled();
    const call = prisma.order.update.mock.calls[0][0];
    expect(call.data.deletedAt).toBeInstanceOf(Date);
    expect(call.where.tenantId).toBe('tenant-1');
    expect(call.where.id).toBe('o1');
  });
});
