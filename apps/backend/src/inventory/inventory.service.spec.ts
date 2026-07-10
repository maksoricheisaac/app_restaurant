import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const T = 'tenant-1';
const ING = {
  id: 'ing-1',
  name: 'Poulet',
  unit: 'kg',
  stock: 10,
  tenantId: T,
  deletedAt: null,
};
const MENU_ITEM = { id: 'item-1', name: 'Yassa', tenantId: T, deletedAt: null };
const RECIPE = {
  id: 'rec-1',
  menuItemId: 'item-1',
  ingredientId: 'ing-1',
  quantity: 0.5,
};

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new InventoryService(prisma as any);
    jest.clearAllMocks();
  });

  // ─── findAllIngredients ───────────────────────────────────────────────────

  describe('findAllIngredients', () => {
    it('throws ForbiddenException when tenantId is missing', async () => {
      await expect(service.findAllIngredients(undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('filters by tenantId and excludes soft-deleted', async () => {
      prisma.ingredient.findMany.mockResolvedValue([ING]);

      await service.findAllIngredients(T);

      const call = prisma.ingredient.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.where.deletedAt).toBeNull();
    });

    it('bounds the result set with a take limit', async () => {
      prisma.ingredient.findMany.mockResolvedValue([ING]);

      await service.findAllIngredients(T);

      const call = prisma.ingredient.findMany.mock.calls[0][0];
      expect(call.take).toBeGreaterThan(0);
    });
  });

  // ─── createIngredient ─────────────────────────────────────────────────────

  describe('createIngredient', () => {
    it('creates ingredient with tenantId', async () => {
      prisma.ingredient.create.mockResolvedValue(ING);

      await service.createIngredient(T, {
        name: 'Poulet',
        unit: 'kg',
        stock: 0,
      } as any);

      const call = prisma.ingredient.create.mock.calls[0][0];
      expect(call.data.tenantId).toBe(T);
    });
  });

  // ─── updateIngredient ─────────────────────────────────────────────────────

  describe('updateIngredient', () => {
    it('throws NotFoundException when ingredient not found in this tenant', async () => {
      prisma.ingredient.findFirst.mockResolvedValue(null);

      await expect(
        service.updateIngredient(T, 'ing-ghost', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('verifies tenant isolation via tenantId in findFirst', async () => {
      prisma.ingredient.findFirst.mockResolvedValue(ING);
      prisma.ingredient.update.mockResolvedValue(ING);

      await service.updateIngredient(T, 'ing-1', { name: 'New Name' });

      const findCall = prisma.ingredient.findFirst.mock.calls[0][0];
      expect(findCall.where.tenantId).toBe(T);
    });
  });

  // ─── removeIngredient (soft delete) ──────────────────────────────────────

  describe('removeIngredient', () => {
    it('throws NotFoundException when ingredient not found', async () => {
      prisma.ingredient.findFirst.mockResolvedValue(null);
      await expect(service.removeIngredient(T, 'ghost')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('soft-deletes by setting deletedAt', async () => {
      prisma.ingredient.findFirst.mockResolvedValue(ING);
      prisma.ingredient.update.mockResolvedValue({
        ...ING,
        deletedAt: new Date(),
      });

      await service.removeIngredient(T, 'ing-1');

      const call = prisma.ingredient.update.mock.calls[0][0];
      expect(call.data.deletedAt).toBeInstanceOf(Date);
    });

    it('includes tenantId in the update where clause (isolation under race)', async () => {
      prisma.ingredient.findFirst.mockResolvedValue(ING);
      prisma.ingredient.update.mockResolvedValue({
        ...ING,
        deletedAt: new Date(),
      });

      await service.removeIngredient(T, 'ing-1');

      const call = prisma.ingredient.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'ing-1', tenantId: T });
    });
  });

  // ─── addStockMovement (transaction) ──────────────────────────────────────

  describe('addStockMovement', () => {
    const dto = {
      ingredientId: 'ing-1',
      type: 'IN',
      quantity: 5,
      description: 'Réception',
    };

    it('runs stock update in a transaction', async () => {
      prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
      prisma.stockMovement.create.mockResolvedValue({ id: 'mov-1', ...dto });
      prisma.ingredient.update.mockResolvedValue({ ...ING, stock: 15 });

      await service.addStockMovement(T, dto as any, 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('increments stock for IN movement', async () => {
      let incrementValue: number | undefined;
      prisma.$transaction.mockImplementation((fn: any) => {
        const tx = {
          stockMovement: {
            create: jest.fn().mockResolvedValue({ id: 'mov-1' }),
          },
          ingredient: {
            update: jest.fn().mockImplementation((args: any) => {
              incrementValue = args.data.stock.increment;
              return Promise.resolve(ING);
            }),
          },
        };
        return fn(tx);
      });

      await service.addStockMovement(T, {
        ...dto,
        type: 'IN',
        quantity: 5,
      } as any);
      expect(incrementValue).toBe(5);
    });

    it('decrements stock for OUT movement', async () => {
      let incrementValue: number | undefined;
      prisma.$transaction.mockImplementation((fn: any) => {
        const tx = {
          stockMovement: {
            create: jest.fn().mockResolvedValue({ id: 'mov-1' }),
          },
          ingredient: {
            update: jest.fn().mockImplementation((args: any) => {
              incrementValue = args.data.stock.increment;
              return Promise.resolve(ING);
            }),
          },
        };
        return fn(tx);
      });

      await service.addStockMovement(T, {
        ...dto,
        type: 'OUT',
        quantity: 3,
      } as any);
      expect(incrementValue).toBe(-3);
    });
  });

  // ─── Recipe management ────────────────────────────────────────────────────

  describe('createRecipe', () => {
    it('throws NotFoundException when menuItem not found in this tenant', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(null);

      await expect(
        service.createRecipe(T, {
          menuItemId: 'ghost',
          ingredientId: 'ing-1',
          quantity: 0.5,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('verifies menuItem belongs to this tenant', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(MENU_ITEM);
      prisma.recipe.create.mockResolvedValue(RECIPE);

      await service.createRecipe(T, {
        menuItemId: 'item-1',
        ingredientId: 'ing-1',
        quantity: 0.5,
      });

      const findCall = prisma.menuItem.findFirst.mock.calls[0][0];
      expect(findCall.where.tenantId).toBe(T);
    });

    it('creates recipe when menuItem exists in tenant', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(MENU_ITEM);
      prisma.recipe.create.mockResolvedValue(RECIPE);

      const result = await service.createRecipe(T, {
        menuItemId: 'item-1',
        ingredientId: 'ing-1',
        quantity: 0.5,
      });

      expect(result).toEqual(RECIPE);
    });
  });

  // ─── getDashboard ─────────────────────────────────────────────────────────

  describe('getDashboard', () => {
    it('throws ForbiddenException when tenantId is missing', async () => {
      await expect(service.getDashboard(undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns inventory summary with low stock count', async () => {
      prisma.ingredient.count.mockResolvedValueOnce(20); // total count
      // lowStockCount utilise $queryRaw pour comparer stock <= COALESCE(minStock, 10)
      prisma.$queryRaw.mockResolvedValueOnce([{ count: BigInt(3) }]);
      prisma.stockMovement.count.mockResolvedValue(50);
      prisma.stockMovement.findMany.mockResolvedValue([]);

      const result = await service.getDashboard(T);

      expect(result.ingredientsCount).toBe(20);
      expect(result.lowStockCount).toBe(3);
      expect(result.movementsCount).toBe(50);
    });

    it('filters ingredient counts by tenantId', async () => {
      prisma.ingredient.count.mockResolvedValue(0);
      prisma.$queryRaw.mockResolvedValueOnce([{ count: BigInt(0) }]);
      prisma.stockMovement.count.mockResolvedValue(0);
      prisma.stockMovement.findMany.mockResolvedValue([]);

      await service.getDashboard(T);

      const call = prisma.ingredient.count.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
    });
  });

  // ─── findMovements ────────────────────────────────────────────────────────

  describe('findMovements', () => {
    it('returns paginated movements for tenant', async () => {
      const movement = { id: 'mov-1', tenantId: T, type: 'IN', quantity: 5 };
      prisma.stockMovement.findMany.mockResolvedValue([movement]);
      prisma.stockMovement.count.mockResolvedValue(1);

      const result = await service.findMovements(T, {} as any);

      const call = prisma.stockMovement.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(result.data).toEqual([movement]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      });
    });

    it('applies pagination params', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([]);
      prisma.stockMovement.count.mockResolvedValue(45);

      await service.findMovements(T, { page: 2, limit: 10 } as any);

      const call = prisma.stockMovement.findMany.mock.calls[0][0];
      expect(call.skip).toBe(10);
      expect(call.take).toBe(10);
    });

    it('filters by ingredientId and type when provided', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([]);
      prisma.stockMovement.count.mockResolvedValue(0);

      await service.findMovements(T, {
        ingredientId: 'ing-1',
        type: 'OUT',
      } as any);

      const call = prisma.stockMovement.findMany.mock.calls[0][0];
      expect(call.where.ingredientId).toBe('ing-1');
      expect(call.where.type).toBe('OUT');
    });
  });

  // ─── getLowStockAlerts ────────────────────────────────────────────────────

  describe('getLowStockAlerts', () => {
    it('returns ingredients below threshold (default 10)', async () => {
      prisma.ingredient.findMany.mockResolvedValue([{ ...ING, stock: 5 }]);

      await service.getLowStockAlerts(T);

      const call = prisma.ingredient.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.where.stock.lte).toBe(10);
    });

    it('accepts custom threshold', async () => {
      prisma.ingredient.findMany.mockResolvedValue([]);

      await service.getLowStockAlerts(T, 5);

      const call = prisma.ingredient.findMany.mock.calls[0][0];
      expect(call.where.stock.lte).toBe(5);
    });
  });

  // ─── decrementStockForOrder ────────────────────────────────────────────────

  describe('decrementStockForOrder', () => {
    const ORDER_ID = 'order-1';

    it('is a no-op when no item has a menuItemId (custom POS items)', async () => {
      const warnings = await service.decrementStockForOrder(
        prisma as any,
        T,
        ORDER_ID,
        [{ menuItemId: null, quantity: 2 }],
      );

      expect(warnings).toEqual([]);
      expect(prisma.recipe.findMany).not.toHaveBeenCalled();
    });

    it('is a no-op when no Recipe is defined for the ordered menu items', async () => {
      prisma.recipe.findMany.mockResolvedValue([]);

      const warnings = await service.decrementStockForOrder(
        prisma as any,
        T,
        ORDER_ID,
        [{ menuItemId: 'item-1', quantity: 2 }],
      );

      expect(warnings).toEqual([]);
      expect(prisma.ingredient.updateMany).not.toHaveBeenCalled();
    });

    it('decrements ingredient stock by recipe.quantity × ordered quantity', async () => {
      prisma.recipe.findMany.mockResolvedValue([
        { menuItemId: 'item-1', ingredientId: 'ing-1', quantity: 0.5 },
      ]);
      prisma.ingredient.updateMany.mockResolvedValue({ count: 1 });
      prisma.ingredient.findFirst.mockResolvedValue({
        id: 'ing-1',
        name: 'Poulet',
        stock: 9,
        minStock: 5,
      });

      await service.decrementStockForOrder(prisma as any, T, ORDER_ID, [
        { menuItemId: 'item-1', quantity: 3 },
      ]);

      const call = prisma.ingredient.updateMany.mock.calls[0][0];
      expect(call.where).toEqual({
        id: 'ing-1',
        tenantId: T,
        stock: { gte: 1.5 }, // 0.5 × 3
      });
      expect(call.data).toEqual({ stock: { decrement: 1.5 } });
    });

    it('sums consumption when the same ingredient is used by several ordered items', async () => {
      prisma.recipe.findMany.mockResolvedValue([
        { menuItemId: 'item-1', ingredientId: 'ing-shared', quantity: 1 },
        { menuItemId: 'item-2', ingredientId: 'ing-shared', quantity: 2 },
      ]);
      prisma.ingredient.updateMany.mockResolvedValue({ count: 1 });
      prisma.ingredient.findFirst.mockResolvedValue({
        id: 'ing-shared',
        name: 'Riz',
        stock: 50,
        minStock: 5,
      });

      await service.decrementStockForOrder(prisma as any, T, ORDER_ID, [
        { menuItemId: 'item-1', quantity: 2 }, // 1 × 2 = 2
        { menuItemId: 'item-2', quantity: 1 }, // 2 × 1 = 2
      ]);

      // Un seul décrément agrégé (2 + 2 = 4), pas deux appels séparés
      expect(prisma.ingredient.updateMany).toHaveBeenCalledTimes(1);
      const call = prisma.ingredient.updateMany.mock.calls[0][0];
      expect(call.where.stock).toEqual({ gte: 4 });
    });

    it('creates a StockMovement referencing the order', async () => {
      prisma.recipe.findMany.mockResolvedValue([
        { menuItemId: 'item-1', ingredientId: 'ing-1', quantity: 1 },
      ]);
      prisma.ingredient.updateMany.mockResolvedValue({ count: 1 });
      prisma.ingredient.findFirst.mockResolvedValue({
        id: 'ing-1',
        name: 'Poulet',
        stock: 20,
        minStock: 5,
      });

      await service.decrementStockForOrder(prisma as any, T, ORDER_ID, [
        { menuItemId: 'item-1', quantity: 1 },
      ]);

      const call = prisma.stockMovement.create.mock.calls[0][0];
      expect(call.data).toMatchObject({
        tenantId: T,
        ingredientId: 'ing-1',
        type: 'OUT',
        quantity: 1,
        orderId: ORDER_ID,
      });
    });

    it('throws ConflictException and rejects the whole order when stock is insufficient', async () => {
      prisma.recipe.findMany.mockResolvedValue([
        { menuItemId: 'item-1', ingredientId: 'ing-1', quantity: 5 },
      ]);
      // Conditional decrement fails: not enough stock to satisfy `stock >= needed`
      prisma.ingredient.updateMany.mockResolvedValue({ count: 0 });
      prisma.ingredient.findFirst.mockResolvedValue({
        id: 'ing-1',
        name: 'Poulet',
        stock: 2,
      });

      await expect(
        service.decrementStockForOrder(prisma as any, T, ORDER_ID, [
          { menuItemId: 'item-1', quantity: 1 },
        ]),
      ).rejects.toThrow(ConflictException);

      expect(prisma.stockMovement.create).not.toHaveBeenCalled();
    });

    it('returns a low-stock warning when the resulting stock is at or below minStock', async () => {
      prisma.recipe.findMany.mockResolvedValue([
        { menuItemId: 'item-1', ingredientId: 'ing-1', quantity: 1 },
      ]);
      prisma.ingredient.updateMany.mockResolvedValue({ count: 1 });
      prisma.ingredient.findFirst.mockResolvedValue({
        id: 'ing-1',
        name: 'Poulet',
        stock: 3,
        minStock: 5,
      });

      const warnings = await service.decrementStockForOrder(
        prisma as any,
        T,
        ORDER_ID,
        [{ menuItemId: 'item-1', quantity: 1 }],
      );

      expect(warnings).toEqual([
        { ingredientId: 'ing-1', name: 'Poulet', stock: 3, minStock: 5 },
      ]);
    });

    it('falls back to the default threshold (10) when minStock is not set', async () => {
      prisma.recipe.findMany.mockResolvedValue([
        { menuItemId: 'item-1', ingredientId: 'ing-1', quantity: 1 },
      ]);
      prisma.ingredient.updateMany.mockResolvedValue({ count: 1 });
      prisma.ingredient.findFirst.mockResolvedValue({
        id: 'ing-1',
        name: 'Poulet',
        stock: 8,
        minStock: null,
      });

      const warnings = await service.decrementStockForOrder(
        prisma as any,
        T,
        ORDER_ID,
        [{ menuItemId: 'item-1', quantity: 1 }],
      );

      expect(warnings).toHaveLength(1);
    });

    it('returns no warning when stock stays comfortably above threshold', async () => {
      prisma.recipe.findMany.mockResolvedValue([
        { menuItemId: 'item-1', ingredientId: 'ing-1', quantity: 1 },
      ]);
      prisma.ingredient.updateMany.mockResolvedValue({ count: 1 });
      prisma.ingredient.findFirst.mockResolvedValue({
        id: 'ing-1',
        name: 'Poulet',
        stock: 100,
        minStock: 5,
      });

      const warnings = await service.decrementStockForOrder(
        prisma as any,
        T,
        ORDER_ID,
        [{ menuItemId: 'item-1', quantity: 1 }],
      );

      expect(warnings).toEqual([]);
    });
  });
});
