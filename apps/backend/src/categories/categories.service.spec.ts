import { CategoriesService } from './categories.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const CAT = { id: 'cat-1', name: 'Entrées', deletedAt: null };

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
    it('orders results by name ascending', async () => {
      prisma.menuCategory.findMany.mockResolvedValue([]);
      await service.findAll();
      const call = prisma.menuCategory.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual({ name: 'asc' });
    });

    it('returns empty array when no categories exist', async () => {
      prisma.menuCategory.findMany.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { name: 'Desserts' };

    it('returns the created category', async () => {
      const created = { id: 'cat-2', name: 'Desserts' };
      prisma.menuCategory.create.mockResolvedValue(created);

      const result = await service.create(dto as any);
      expect(result).toEqual(created);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('met à jour la catégorie par son identifiant', async () => {
      const dto = { name: 'Entrées chaudes' };
      prisma.menuCategory.update.mockResolvedValue({ ...CAT, ...dto });

      const result = await service.update('cat-1', dto);

      expect(prisma.menuCategory.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: dto,
      });
      expect(result).toEqual({ ...CAT, ...dto });
    });
  });

  // ─── remove (soft delete in transaction) ─────────────────────────────────

  describe('remove', () => {
    it('runs soft-delete in a Prisma transaction', async () => {
      prisma.$transaction.mockResolvedValue([{ count: 2 }, CAT]);

      await service.remove('cat-1');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('soft-deletes child items before soft-deleting the category', async () => {
      let capturedOps: any[] = [];
      prisma.$transaction.mockImplementation((ops: any[]) => {
        capturedOps = ops;
        return Promise.resolve(ops);
      });

      await service.remove('cat-1');

      // $transaction receives an array [updateMany(items), update(category)]
      expect(capturedOps).toHaveLength(2);
    });
  });
});
