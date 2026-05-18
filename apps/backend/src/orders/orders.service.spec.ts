import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';
import { OrderType } from './dto/create-order.dto';

const mockEventsService = { emitToTenant: jest.fn(), emitToRoom: jest.fn() };
const mockPlanLimitService = { assertMonthlyOrderLimit: jest.fn().mockResolvedValue(undefined) };

describe('OrdersService — price injection prevention', () => {
  let service: OrdersService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new OrdersService(prisma as any, mockEventsService as any, mockPlanLimitService as any);
    jest.clearAllMocks();
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
      prisma.order.create.mockResolvedValue({ id: 'order-1', total: 5000, orderItems: [], table: null });

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
      prisma.order.create.mockResolvedValue({ id: 'order-1', total: 5000, orderItems: [], table: null });

      await service.create('tenant-1', baseOrderData as any);

      const createCall = prisma.order.create.mock.calls[0][0];
      // 2 × 2500 = 5000 (not 2 × 0.01 = 0.02)
      expect(createCall.data.total).toBe(5000);
    });

    it('throws BadRequestException for menuItemId from another tenant', async () => {
      // DB returns empty — the item doesn't exist in this tenant
      prisma.menuItem.findMany.mockResolvedValue([]);

      await expect(service.create('tenant-1', baseOrderData as any))
        .rejects.toThrow(BadRequestException);
    });

    it('queries menuItems with tenantId isolation', async () => {
      prisma.menuItem.findMany.mockResolvedValue([
        { id: 'menu-1', name: 'Yassa poulet', price: 2500, image: null },
      ]);
      prisma.order.create.mockResolvedValue({ id: 'order-1', total: 5000, orderItems: [], table: null });

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

      prisma.order.create.mockResolvedValue({ id: 'order-1', total: 1500, orderItems: [], table: null });

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
      prisma.order.create.mockResolvedValue({ id: 'o1', total: 4600, orderItems: [], table: null });

      await service.create('tenant-1', mixedOrder as any);

      const createCall = prisma.order.create.mock.calls[0][0];
      const items = createCall.data.orderItems.create;

      expect(items[0].price).toBe(3000); // DB price
      expect(items[1].price).toBe(800);  // staff price (no menuItemId)
      expect(createCall.data.total).toBe(3000 + 1600); // 3000×1 + 800×2
    });
  });

  describe('create — plan limit enforcement', () => {
    it('calls assertMonthlyOrderLimit before creating the order', async () => {
      prisma.menuItem.findMany.mockResolvedValue([
        { id: 'menu-1', name: 'Item', price: 1000, image: null },
      ]);
      prisma.order.create.mockResolvedValue({ id: 'o1', total: 1000, orderItems: [], table: null });

      await service.create('tenant-1', {
        type: OrderType.DINE_IN,
        items: [{ menuItemId: 'menu-1', name: 'Item', quantity: 1, price: 1000 }],
      } as any);

      expect(mockPlanLimitService.assertMonthlyOrderLimit).toHaveBeenCalledWith('tenant-1');
    });

    it('does not create order if monthly limit exceeded', async () => {
      mockPlanLimitService.assertMonthlyOrderLimit.mockRejectedValue(
        new Error('Quota dépassé'),
      );

      await expect(service.create('tenant-1', {
        type: OrderType.DINE_IN,
        items: [{ menuItemId: 'menu-1', name: 'Item', quantity: 1, price: 1000 }],
      } as any)).rejects.toThrow('Quota dépassé');

      expect(prisma.order.create).not.toHaveBeenCalled();
    });
  });
});
