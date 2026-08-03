import { ConflictException } from '@nestjs/common';
import { TablesService } from './tables.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const TABLE = {
  id: 'tbl-1',
  number: 5,
  seats: 4,
  deletedAt: null,
  status: 'available',
};

describe('TablesService', () => {
  let service: TablesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new TablesService(prisma as any);
    jest.clearAllMocks();
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('orders tables by number ascending', async () => {
      prisma.table.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(prisma.table.findMany.mock.calls[0][0].orderBy).toEqual({
        number: 'asc',
      });
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {});

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { number: 5, seats: 4 };

    it('throws ConflictException when table number already exists', async () => {
      prisma.table.findFirst.mockResolvedValue(TABLE); // existing table

      await expect(service.create(dto as any)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.table.create).not.toHaveBeenCalled();
    });
  });

  // ─── remove (soft delete) ─────────────────────────────────────────────────

  describe('remove', () => {
    it('soft-deletes by setting deletedAt', async () => {
      prisma.table.update.mockResolvedValue({
        ...TABLE,
        deletedAt: new Date(),
      });

      await service.remove('tbl-1');

      const call = prisma.table.update.mock.calls[0][0];
      expect(call.data.deletedAt).toBeInstanceOf(Date);
    });
  });
});
