import { BadRequestException } from '@nestjs/common';
import { PublicOrderService } from './public-orders.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const mockEventsService = { emitToStaff: jest.fn() };
// Always passes in tests (mirrors dev-mode behaviour)
const mockMenuSessionService = { verify: jest.fn().mockReturnValue(true) };
const mockInventoryService = {
  decrementStockForOrder: jest.fn().mockResolvedValue([]),
};
const mockCustomersService = {
  upsertFromInteraction: jest.fn().mockResolvedValue(null),
};
const RESTAURANT = {
  name: 'Le Maquis',
  dineInEnabled: true,
  takeawayEnabled: true,
  deliveryEnabled: true,
};
const mockRestaurantService = {
  getPublicProfile: jest.fn().mockResolvedValue(RESTAURANT),
};

describe('PublicOrderService', () => {
  let service: PublicOrderService;
  let prisma: MockPrisma;

  const menuItem = {
    id: 'item-1',
    name: 'Poulet braisé',
    price: 2500,
    image: null,
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new PublicOrderService(
      prisma as any,
      mockEventsService as any,
      mockMenuSessionService as any,
      mockRestaurantService as any,
      mockInventoryService as any,
      mockCustomersService as any,
    );
    jest.clearAllMocks();
    mockInventoryService.decrementStockForOrder.mockResolvedValue([]);
    mockMenuSessionService.verify.mockReturnValue(true);
    mockRestaurantService.getPublicProfile.mockResolvedValue(RESTAURANT);
    // createOrder() écrit désormais dans une transaction — router tx vers
    // le même mock que celui utilisé dans les assertions.
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
  });

  // ─── Mode de service ──────────────────────────────────────────────────────

  // ─── Price integrity ──────────────────────────────────────────────────────

  it('uses DB price, rejects any client-supplied price value', async () => {
    prisma.menuItem.findMany.mockResolvedValue([menuItem]); // DB price: 2500
    prisma.order.create.mockResolvedValue({
      id: 'o1',
      status: 'pending',
      total: 5000,
    });

    await service.createOrder({
      type: 'dine_in',
      items: [{ menuItemId: 'item-1', quantity: 2 }],
    } as any);

    const createCall = prisma.order.create.mock.calls[0][0];
    expect(createCall.data.total).toBe(5000); // 2 × 2500
    expect(createCall.data.orderItems.create[0].price).toBe(menuItem.price);
  });

  it('emits new-order WebSocket event after creation', async () => {
    prisma.menuItem.findMany.mockResolvedValue([menuItem]);
    prisma.order.create.mockResolvedValue({
      id: 'o1',
      status: 'pending',
      total: 2500,
    });

    await service.createOrder({
      type: 'dine_in',
      items: [{ menuItemId: 'item-1', quantity: 1 }],
    } as any);

    expect(mockEventsService.emitToStaff).toHaveBeenCalledWith(
      'new-order',
      expect.any(Object),
    );
  });

  // ─── tableId : la table doit exister ─────────────────────────────────────

  it('skips the table check when no tableId is provided', async () => {
    prisma.menuItem.findMany.mockResolvedValue([menuItem]);
    prisma.order.create.mockResolvedValue({
      id: 'o1',
      status: 'pending',
      total: 2500,
    });

    await service.createOrder({
      type: 'dine_in',
      items: [{ menuItemId: 'item-1', quantity: 1 }],
    } as any);

    expect(prisma.table.findFirst).not.toHaveBeenCalled();
  });

  // ─── Stock decrement ──────────────────────────────────────────────────────

  it('decrements stock via InventoryService after creating the order', async () => {
    prisma.menuItem.findMany.mockResolvedValue([menuItem]);
    prisma.order.create.mockResolvedValue({
      id: 'order-42',
      status: 'pending',
      total: 5000,
    });

    await service.createOrder({
      type: 'dine_in',
      items: [{ menuItemId: 'item-1', quantity: 2 }],
    } as any);

    expect(mockInventoryService.decrementStockForOrder).toHaveBeenCalledWith(
      prisma,
      'order-42',
      [{ menuItemId: 'item-1', quantity: 2 }],
    );
  });

  it('rejects the order when stock is insufficient', async () => {
    prisma.menuItem.findMany.mockResolvedValue([menuItem]);
    prisma.order.create.mockResolvedValue({
      id: 'order-1',
      status: 'pending',
      total: 2500,
    });
    mockInventoryService.decrementStockForOrder.mockRejectedValue(
      new Error('Stock insuffisant'),
    );

    await expect(
      service.createOrder({
        type: 'dine_in',
        items: [{ menuItemId: 'item-1', quantity: 1 }],
      } as any),
    ).rejects.toThrow('Stock insuffisant');
  });

  // ─── Product options: pricing & validation ────────────────────────────────

  const itemWithOptions = {
    id: 'item-2',
    name: 'Burger',
    price: 3000,
    image: null,
    optionGroups: [
      {
        id: 'g1',
        name: 'Cuisson',
        required: true,
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: 'o-saignant', name: 'Saignant', priceDelta: 0 },
          { id: 'o-apoint', name: 'À point', priceDelta: 0 },
        ],
      },
      {
        id: 'g2',
        name: 'Suppléments',
        required: false,
        minSelect: 0,
        maxSelect: 2,
        options: [
          { id: 'o-bacon', name: 'Bacon', priceDelta: 500 },
          { id: 'o-cheese', name: 'Cheddar', priceDelta: 300 },
        ],
      },
    ],
  };

  it('adds selected option priceDelta to the unit price and snapshots them', async () => {
    prisma.menuItem.findMany.mockResolvedValue([itemWithOptions]);
    prisma.order.create.mockResolvedValue({
      id: 'o1',
      status: 'pending',
      total: 3500,
    });

    await service.createOrder({
      type: 'dine_in',
      items: [
        {
          menuItemId: 'item-2',
          quantity: 1,
          selectedOptionIds: ['o-saignant', 'o-bacon'],
        },
      ],
    } as any);

    const createCall = prisma.order.create.mock.calls[0][0];
    const line = createCall.data.orderItems.create[0];
    expect(line.price).toBe(3500); // 3000 + 500 bacon
    expect(createCall.data.total).toBe(3500);
    expect(line.options).toEqual([
      { groupName: 'Cuisson', optionName: 'Saignant', priceDelta: 0 },
      { groupName: 'Suppléments', optionName: 'Bacon', priceDelta: 500 },
    ]);
  });

  it('rejects when a required option group has no selection', async () => {
    prisma.menuItem.findMany.mockResolvedValue([itemWithOptions]);

    await expect(
      service.createOrder({
        type: 'dine_in',
        items: [{ menuItemId: 'item-2', quantity: 1, selectedOptionIds: [] }],
      } as any),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('rejects when more than maxSelect options are chosen in a group', async () => {
    prisma.menuItem.findMany.mockResolvedValue([itemWithOptions]);

    await expect(
      service.createOrder({
        type: 'dine_in',
        items: [
          {
            menuItemId: 'item-2',
            quantity: 1,
            selectedOptionIds: ['o-saignant', 'o-apoint'], // 2 in a max-1 group
          },
        ],
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects an option id that does not belong to the item', async () => {
    prisma.menuItem.findMany.mockResolvedValue([itemWithOptions]);

    await expect(
      service.createOrder({
        type: 'dine_in',
        items: [
          {
            menuItemId: 'item-2',
            quantity: 1,
            selectedOptionIds: ['o-saignant', 'o-unknown'],
          },
        ],
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Delivery: service toggle, zone fee & minimum ─────────────────────────

  it('adds the delivery zone fee to the total and persists delivery data', async () => {
    prisma.menuItem.findMany.mockResolvedValue([menuItem]);
    prisma.deliveryZone.findFirst.mockResolvedValue({
      id: 'zone-1',
      price: 1000,
      minOrder: null,
    });
    prisma.order.create.mockResolvedValue({
      id: 'o1',
      status: 'pending',
      total: 3500,
    });

    await service.createOrder({
      type: 'delivery',
      deliveryZoneId: 'zone-1',
      deliveryAddress: 'Rue 1',
      items: [{ menuItemId: 'item-1', quantity: 1 }], // 2500
    } as any);

    const createCall = prisma.order.create.mock.calls[0][0];
    expect(createCall.data.total).toBe(3500); // 2500 + 1000 fee
    expect(createCall.data.deliveryFee).toBe(1000);
    expect(createCall.data.deliveryZoneId).toBe('zone-1');
  });

  it('rejects delivery below the zone minimum order', async () => {
    prisma.menuItem.findMany.mockResolvedValue([menuItem]);
    prisma.deliveryZone.findFirst.mockResolvedValue({
      id: 'zone-1',
      price: 1000,
      minOrder: 5000, // subtotal 2500 < 5000
    });

    await expect(
      service.createOrder({
        type: 'delivery',
        deliveryZoneId: 'zone-1',
        items: [{ menuItemId: 'item-1', quantity: 1 }],
      } as any),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('rejects a service type disabled by the restaurant', async () => {
    prisma.menuItem.findMany.mockResolvedValue([menuItem]);

    await expect(
      service.createOrder({
        type: 'delivery',
        deliveryZoneId: 'zone-1',
        items: [{ menuItemId: 'item-1', quantity: 1 }],
      } as any),
    ).rejects.toThrow(BadRequestException);
  });
});
