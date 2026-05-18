import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const T = 'tenant-1';
const ING = { id: 'ing-1', name: 'Poulet', unit: 'kg', stock: 10, tenantId: T, deletedAt: null };
const MENU_ITEM = { id: 'item-1', name: 'Yassa', tenantId: T, deletedAt: null };
const RECIPE = { id: 'rec-1', menuItemId: 'item-1', ingredientId: 'ing-1', quantity: 0.5 };

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
      await expect(service.findAllIngredients(undefined)).rejects.toThrow(ForbiddenException);
    });

    it('filters by tenantId and excludes soft-deleted', async () => {
      prisma.ingredient.findMany.mockResolvedValue([ING]);

      await service.findAllIngredients(T);

      const call = prisma.ingredient.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.where.deletedAt).toBeNull();
    });
  });

  // ─── createIngredient ─────────────────────────────────────────────────────

  describe('createIngredient', () => {
    it('creates ingredient with tenantId', async () => {
      prisma.ingredient.create.mockResolvedValue(ING);

      await service.createIngredient(T, { name: 'Poulet', unit: 'kg', stock: 0 } as any);

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
      await expect(service.removeIngredient(T, 'ghost')).rejects.toThrow(NotFoundException);
    });

    it('soft-deletes by setting deletedAt', async () => {
      prisma.ingredient.findFirst.mockResolvedValue(ING);
      prisma.ingredient.update.mockResolvedValue({ ...ING, deletedAt: new Date() });

      await service.removeIngredient(T, 'ing-1');

      const call = prisma.ingredient.update.mock.calls[0][0];
      expect(call.data.deletedAt).toBeInstanceOf(Date);
    });
  });

  // ─── addStockMovement (transaction) ──────────────────────────────────────

  describe('addStockMovement', () => {
    const dto = { ingredientId: 'ing-1', type: 'IN', quantity: 5, description: 'Réception' };

    it('runs stock update in a transaction', async () => {
      prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma));
      prisma.stockMovement.create.mockResolvedValue({ id: 'mov-1', ...dto });
      prisma.ingredient.update.mockResolvedValue({ ...ING, stock: 15 });

      await service.addStockMovement(T, dto as any, 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('increments stock for IN movement', async () => {
      let incrementValue: number | undefined;
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          stockMovement: { create: jest.fn().mockResolvedValue({ id: 'mov-1' }) },
          ingredient: {
            update: jest.fn().mockImplementation((args: any) => {
              incrementValue = args.data.stock.increment;
              return Promise.resolve(ING);
            }),
          },
        };
        return fn(tx);
      });

      await service.addStockMovement(T, { ...dto, type: 'IN', quantity: 5 } as any);
      expect(incrementValue).toBe(5);
    });

    it('decrements stock for OUT movement', async () => {
      let incrementValue: number | undefined;
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          stockMovement: { create: jest.fn().mockResolvedValue({ id: 'mov-1' }) },
          ingredient: {
            update: jest.fn().mockImplementation((args: any) => {
              incrementValue = args.data.stock.increment;
              return Promise.resolve(ING);
            }),
          },
        };
        return fn(tx);
      });

      await service.addStockMovement(T, { ...dto, type: 'OUT', quantity: 3 } as any);
      expect(incrementValue).toBe(-3);
    });
  });

  // ─── Recipe management ────────────────────────────────────────────────────

  describe('createRecipe', () => {
    it('throws NotFoundException when menuItem not found in this tenant', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(null);

      await expect(
        service.createRecipe(T, { menuItemId: 'ghost', ingredientId: 'ing-1', quantity: 0.5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('verifies menuItem belongs to this tenant', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(MENU_ITEM);
      prisma.recipe.create.mockResolvedValue(RECIPE);

      await service.createRecipe(T, { menuItemId: 'item-1', ingredientId: 'ing-1', quantity: 0.5 });

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
      await expect(service.getDashboard(undefined)).rejects.toThrow(ForbiddenException);
    });

    it('returns inventory summary with low stock count', async () => {
      prisma.ingredient.count
        .mockResolvedValueOnce(20)  // total
        .mockResolvedValueOnce(3);  // low stock
      prisma.stockMovement.count.mockResolvedValue(50);
      prisma.stockMovement.findMany.mockResolvedValue([]);

      const result = await service.getDashboard(T);

      expect(result.ingredientsCount).toBe(20);
      expect(result.lowStockCount).toBe(3);
      expect(result.movementsCount).toBe(50);
    });

    it('filters ingredient counts by tenantId', async () => {
      prisma.ingredient.count.mockResolvedValue(0);
      prisma.stockMovement.count.mockResolvedValue(0);
      prisma.stockMovement.findMany.mockResolvedValue([]);

      await service.getDashboard(T);

      const call = prisma.ingredient.count.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
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
});
