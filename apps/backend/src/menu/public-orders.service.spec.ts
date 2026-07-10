import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PublicOrderService } from './public-orders.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const mockEventsService = { emitToTenant: jest.fn() };
const mockPlanLimitService = {
  assertMonthlyOrderLimit: jest.fn().mockResolvedValue(undefined),
};
// Always passes in tests (mirrors dev-mode behaviour)
const mockMenuSessionService = { verify: jest.fn().mockReturnValue(true) };
const mockInventoryService = {
  decrementStockForOrder: jest.fn().mockResolvedValue([]),
};

describe('PublicOrderService', () => {
  let service: PublicOrderService;
  let prisma: MockPrisma;

  const tenant = { id: 'tenant-1', name: 'Le Maquis' };
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
      mockPlanLimitService as any,
      mockMenuSessionService as any,
      mockInventoryService as any,
    );
    jest.clearAllMocks();
    mockPlanLimitService.assertMonthlyOrderLimit.mockResolvedValue(undefined);
    mockInventoryService.decrementStockForOrder.mockResolvedValue([]);
    // createOrder() écrit désormais dans une transaction — router tx vers
    // le même mock que celui utilisé dans les assertions.
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
  });

  // ─── Plan limit enforcement ──────────────────────────────────────────────

  it('calls assertMonthlyOrderLimit before creating the order', async () => {
    prisma.tenant.findFirst.mockResolvedValue(tenant);
    prisma.menuItem.findMany.mockResolvedValue([menuItem]);
    prisma.order.create.mockResolvedValue({
      id: 'order-1',
      status: 'pending',
      total: 5000,
    });

    await service.createOrder('le-maquis', {
      type: 'dine_in',
      items: [{ menuItemId: 'item-1', quantity: 2 }],
    } as any);

    expect(mockPlanLimitService.assertMonthlyOrderLimit).toHaveBeenCalledWith(
      'tenant-1',
    );
  });

  it('does NOT create the order when monthly limit is exceeded', async () => {
    prisma.tenant.findFirst.mockResolvedValue(tenant);
    mockPlanLimitService.assertMonthlyOrderLimit.mockRejectedValue(
      new ForbiddenException('Quota mensuel atteint'),
    );

    await expect(
      service.createOrder('le-maquis', {
        type: 'dine_in',
        items: [{ menuItemId: 'item-1', quantity: 1 }],
      } as any),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('quota check happens before menuItem DB lookup (fail fast)', async () => {
    prisma.tenant.findFirst.mockResolvedValue(tenant);
    mockPlanLimitService.assertMonthlyOrderLimit.mockRejectedValue(
      new ForbiddenException('Quota dépassé'),
    );

    await expect(
      service.createOrder('le-maquis', {
        type: 'dine_in',
        items: [{ menuItemId: 'item-1', quantity: 1 }],
      } as any),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.menuItem.findMany).not.toHaveBeenCalled();
  });

  // ─── Tenant resolution ────────────────────────────────────────────────────

  it('throws NotFoundException for unknown slug', async () => {
    prisma.tenant.findFirst.mockResolvedValue(null);

    await expect(
      service.createOrder('unknown', {
        type: 'dine_in',
        items: [{ menuItemId: 'item-1', quantity: 1 }],
      } as any),
    ).rejects.toThrow(NotFoundException);

    expect(mockPlanLimitService.assertMonthlyOrderLimit).not.toHaveBeenCalled();
  });

  // ─── Price integrity ──────────────────────────────────────────────────────

  it('uses DB price, rejects any client-supplied price value', async () => {
    prisma.tenant.findFirst.mockResolvedValue(tenant);
    prisma.menuItem.findMany.mockResolvedValue([menuItem]); // DB price: 2500
    prisma.order.create.mockResolvedValue({
      id: 'o1',
      status: 'pending',
      total: 5000,
    });

    await service.createOrder('le-maquis', {
      type: 'dine_in',
      items: [{ menuItemId: 'item-1', quantity: 2 }],
    } as any);

    const createCall = prisma.order.create.mock.calls[0][0];
    expect(createCall.data.total).toBe(5000); // 2 × 2500
    expect(createCall.data.orderItems.create[0].price).toBe(menuItem.price);
  });

  it('queries menuItems with tenant isolation (tenantId filter)', async () => {
    prisma.tenant.findFirst.mockResolvedValue(tenant);
    prisma.menuItem.findMany.mockResolvedValue([menuItem]);
    prisma.order.create.mockResolvedValue({
      id: 'o1',
      status: 'pending',
      total: 2500,
    });

    await service.createOrder('le-maquis', {
      type: 'dine_in',
      items: [{ menuItemId: 'item-1', quantity: 1 }],
    } as any);

    const findCall = prisma.menuItem.findMany.mock.calls[0][0];
    expect(findCall.where.tenantId).toBe('tenant-1');
  });

  it('throws BadRequestException when menuItem is from another tenant', async () => {
    prisma.tenant.findFirst.mockResolvedValue(tenant);
    prisma.menuItem.findMany.mockResolvedValue([]); // 0 results = item not in this tenant

    await expect(
      service.createOrder('le-maquis', {
        type: 'dine_in',
        items: [{ menuItemId: 'item-from-other-tenant', quantity: 1 }],
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('emits new-order WebSocket event after creation', async () => {
    prisma.tenant.findFirst.mockResolvedValue(tenant);
    prisma.menuItem.findMany.mockResolvedValue([menuItem]);
    prisma.order.create.mockResolvedValue({
      id: 'o1',
      status: 'pending',
      total: 2500,
    });

    await service.createOrder('le-maquis', {
      type: 'dine_in',
      items: [{ menuItemId: 'item-1', quantity: 1 }],
    } as any);

    expect(mockEventsService.emitToTenant).toHaveBeenCalledWith(
      'tenant-1',
      'new-order',
      expect.any(Object),
    );
  });

  // ─── tableId tenant ownership ────────────────────────────────────────────

  it('rejects a tableId that does not belong to the resolved tenant', async () => {
    prisma.tenant.findFirst.mockResolvedValue(tenant);
    prisma.menuItem.findMany.mockResolvedValue([menuItem]);
    prisma.table.findFirst.mockResolvedValue(null); // foreign/unknown table

    await expect(
      service.createOrder('le-maquis', {
        type: 'dine_in',
        tableId: 'table-from-other-tenant',
        items: [{ menuItemId: 'item-1', quantity: 1 }],
      } as any),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('accepts a tableId that belongs to the resolved tenant', async () => {
    prisma.tenant.findFirst.mockResolvedValue(tenant);
    prisma.menuItem.findMany.mockResolvedValue([menuItem]);
    prisma.table.findFirst.mockResolvedValue({ id: 'table-1' });
    prisma.order.create.mockResolvedValue({
      id: 'o1',
      status: 'pending',
      total: 2500,
    });

    await expect(
      service.createOrder('le-maquis', {
        type: 'dine_in',
        tableId: 'table-1',
        items: [{ menuItemId: 'item-1', quantity: 1 }],
      } as any),
    ).resolves.toBeDefined();

    const tableCall = prisma.table.findFirst.mock.calls[0][0];
    expect(tableCall.where).toEqual({
      id: 'table-1',
      tenantId: 'tenant-1',
      deletedAt: null,
    });
  });

  it('skips the table check when no tableId is provided', async () => {
    prisma.tenant.findFirst.mockResolvedValue(tenant);
    prisma.menuItem.findMany.mockResolvedValue([menuItem]);
    prisma.order.create.mockResolvedValue({
      id: 'o1',
      status: 'pending',
      total: 2500,
    });

    await service.createOrder('le-maquis', {
      type: 'dine_in',
      items: [{ menuItemId: 'item-1', quantity: 1 }],
    } as any);

    expect(prisma.table.findFirst).not.toHaveBeenCalled();
  });

  // ─── Stock decrement ──────────────────────────────────────────────────────

  it('decrements stock via InventoryService after creating the order', async () => {
    prisma.tenant.findFirst.mockResolvedValue(tenant);
    prisma.menuItem.findMany.mockResolvedValue([menuItem]);
    prisma.order.create.mockResolvedValue({
      id: 'order-42',
      status: 'pending',
      total: 5000,
    });

    await service.createOrder('le-maquis', {
      type: 'dine_in',
      items: [{ menuItemId: 'item-1', quantity: 2 }],
    } as any);

    expect(mockInventoryService.decrementStockForOrder).toHaveBeenCalledWith(
      prisma,
      'tenant-1',
      'order-42',
      [{ menuItemId: 'item-1', quantity: 2 }],
    );
  });

  it('rejects the order when stock is insufficient', async () => {
    prisma.tenant.findFirst.mockResolvedValue(tenant);
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
      service.createOrder('le-maquis', {
        type: 'dine_in',
        items: [{ menuItemId: 'item-1', quantity: 1 }],
      } as any),
    ).rejects.toThrow('Stock insuffisant');
  });
});
