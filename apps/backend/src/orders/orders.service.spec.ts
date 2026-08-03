import { OrdersService } from './orders.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';
import { OrderType } from './dto/create-order.dto';

const mockEventsService = { emitToStaff: jest.fn(), emitToRoom: jest.fn() };
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
      mockCustomersService as any,
      mockInventoryService as any,
    );
    jest.clearAllMocks();
    mockInventoryService.decrementStockForOrder.mockResolvedValue([]);
    // create() écrit désormais dans une transaction — router tx vers le
    // même mock que celui utilisé dans les assertions.
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
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

      await service.create(baseOrderData as any);

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

      await service.create(baseOrderData as any);

      const createCall = prisma.order.create.mock.calls[0][0];
      // 2 × 2500 = 5000 (not 2 × 0.01 = 0.02)
      expect(createCall.data.total).toBe(5000);
    });
  });
});
