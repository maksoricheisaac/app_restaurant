import { NotFoundException, ConflictException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const ING = {
  id: 'ing-1',
  name: 'Poulet',
  unit: 'kg',
  stock: 10,
  deletedAt: null,
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
    it('bounds the result set with a take limit', async () => {
      prisma.ingredient.findMany.mockResolvedValue([ING]);

      await service.findAllIngredients();

      const call = prisma.ingredient.findMany.mock.calls[0][0];
      expect(call.take).toBeGreaterThan(0);
    });
  });

  // ─── createIngredient ─────────────────────────────────────────────────────

  describe('createIngredient', () => {});

  // ─── updateIngredient ─────────────────────────────────────────────────────

  describe('updateIngredient', () => {});

  // ─── removeIngredient (soft delete) ──────────────────────────────────────

  describe('removeIngredient', () => {
    it('throws NotFoundException when ingredient not found', async () => {
      prisma.ingredient.findFirst.mockResolvedValue(null);
      await expect(service.removeIngredient('ghost')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('soft-deletes by setting deletedAt', async () => {
      prisma.ingredient.findFirst.mockResolvedValue(ING);
      prisma.ingredient.update.mockResolvedValue({
        ...ING,
        deletedAt: new Date(),
      });

      await service.removeIngredient('ing-1');

      const call = prisma.ingredient.update.mock.calls[0][0];
      expect(call.data.deletedAt).toBeInstanceOf(Date);
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

      await service.addStockMovement(dto as any, 'user-1');

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

      await service.addStockMovement({
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

      await service.addStockMovement({
        ...dto,
        type: 'OUT',
        quantity: 3,
      } as any);
      expect(incrementValue).toBe(-3);
    });
  });

  // ─── Recipe management ────────────────────────────────────────────────────

  describe('createRecipe', () => {});

  // ─── getDashboard ─────────────────────────────────────────────────────────

  describe('getDashboard', () => {
    it('returns inventory summary with low stock count', async () => {
      prisma.ingredient.count.mockResolvedValueOnce(20); // total count
      // lowStockCount utilise $queryRaw pour comparer stock <= COALESCE(minStock, 10)
      prisma.$queryRaw.mockResolvedValueOnce([{ count: BigInt(3) }]);
      prisma.stockMovement.count.mockResolvedValue(50);
      prisma.stockMovement.findMany.mockResolvedValue([]);

      const result = await service.getDashboard();

      expect(result.ingredientsCount).toBe(20);
      expect(result.lowStockCount).toBe(3);
      expect(result.movementsCount).toBe(50);
    });
  });

  // ─── findMovements ────────────────────────────────────────────────────────

  describe('findMovements', () => {
    it('applies pagination params', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([]);
      prisma.stockMovement.count.mockResolvedValue(45);

      await service.findMovements({ page: 2, limit: 10 } as any);

      const call = prisma.stockMovement.findMany.mock.calls[0][0];
      expect(call.skip).toBe(10);
      expect(call.take).toBe(10);
    });

    it('filters by ingredientId and type when provided', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([]);
      prisma.stockMovement.count.mockResolvedValue(0);

      await service.findMovements({
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

      await service.getLowStockAlerts();

      const call = prisma.ingredient.findMany.mock.calls[0][0];
      expect(call.where.stock.lte).toBe(10);
    });

    it('accepts custom threshold', async () => {
      prisma.ingredient.findMany.mockResolvedValue([]);

      await service.getLowStockAlerts(5);

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

      await service.decrementStockForOrder(prisma as any, ORDER_ID, [
        { menuItemId: 'item-1', quantity: 3 },
      ]);

      const call = prisma.ingredient.updateMany.mock.calls[0][0];
      expect(call.where).toEqual({
        id: 'ing-1',
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

      await service.decrementStockForOrder(prisma as any, ORDER_ID, [
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

      await service.decrementStockForOrder(prisma as any, ORDER_ID, [
        { menuItemId: 'item-1', quantity: 1 },
      ]);

      const call = prisma.stockMovement.create.mock.calls[0][0];
      expect(call.data).toMatchObject({
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
        service.decrementStockForOrder(prisma as any, ORDER_ID, [
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
        ORDER_ID,
        [{ menuItemId: 'item-1', quantity: 1 }],
      );

      expect(warnings).toEqual([]);
    });
  });
});
