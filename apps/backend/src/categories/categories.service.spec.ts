import { ForbiddenException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const T = 'tenant-1';
const CAT = { id: 'cat-1', name: 'Entrées', tenantId: T, deletedAt: null };

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new CategoriesService(prisma as any);
    jest.clearAllMocks();
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('throws ForbiddenException when tenantId is missing', async () => {
      await expect(service.findAll(undefined)).rejects.toThrow(ForbiddenException);
      expect(prisma.menuCategory.findMany).not.toHaveBeenCalled();
    });

    it('queries only non-deleted categories for the tenant', async () => {
      prisma.menuCategory.findMany.mockResolvedValue([CAT]);

      const result = await service.findAll(T);

      expect(result).toEqual([CAT]);
      const call = prisma.menuCategory.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.where.deletedAt).toBeNull();
    });

    it('orders results by name ascending', async () => {
      prisma.menuCategory.findMany.mockResolvedValue([]);
      await service.findAll(T);
      const call = prisma.menuCategory.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual({ name: 'asc' });
    });

    it('returns empty array when no categories exist', async () => {
      prisma.menuCategory.findMany.mockResolvedValue([]);
      const result = await service.findAll(T);
      expect(result).toEqual([]);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { name: 'Desserts' };

    it('creates category with correct tenantId', async () => {
      prisma.menuCategory.create.mockResolvedValue({ ...CAT, name: 'Desserts' });

      await service.create(T, dto as any);

      const call = prisma.menuCategory.create.mock.calls[0][0];
      expect(call.data.tenantId).toBe(T);
      expect(call.data.name).toBe('Desserts');
    });

    it('returns the created category', async () => {
      const created = { id: 'cat-2', name: 'Desserts', tenantId: T };
      prisma.menuCategory.create.mockResolvedValue(created);

      const result = await service.create(T, dto as any);
      expect(result).toEqual(created);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    const dto = { name: 'Entrées chaudes' };

    it('throws ForbiddenException when tenantId is missing', async () => {
      await expect(service.update(undefined, 'cat-1', dto as any)).rejects.toThrow(ForbiddenException);
    });

    it('updates only the category belonging to this tenant', async () => {
      prisma.menuCategory.update.mockResolvedValue({ ...CAT, name: 'Entrées chaudes' });

      await service.update(T, 'cat-1', dto as any);

      const call = prisma.menuCategory.update.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.where.id).toBe('cat-1');
    });
  });

  // ─── remove (soft delete in transaction) ─────────────────────────────────

  describe('remove', () => {
    it('throws ForbiddenException when tenantId is missing', async () => {
      await expect(service.remove(undefined, 'cat-1')).rejects.toThrow(ForbiddenException);
    });

    it('runs soft-delete in a Prisma transaction', async () => {
      prisma.$transaction.mockResolvedValue([{ count: 2 }, CAT]);

      await service.remove(T, 'cat-1');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('soft-deletes child items before soft-deleting the category', async () => {
      let capturedOps: any[] = [];
      prisma.$transaction.mockImplementation(async (ops: any[]) => {
        capturedOps = ops;
        return ops;
      });

      await service.remove(T, 'cat-1');

      // $transaction receives an array [updateMany(items), update(category)]
      expect(capturedOps).toHaveLength(2);
    });
  });
});
