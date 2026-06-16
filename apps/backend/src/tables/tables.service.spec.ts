import { ForbiddenException, ConflictException } from '@nestjs/common';
import { TablesService } from './tables.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const T = 'tenant-1';
const TABLE = {
  id: 'tbl-1',
  number: 5,
  seats: 4,
  tenantId: T,
  deletedAt: null,
  status: 'available',
};

const mockPlanLimitService = {
  assertTableLimit: jest.fn().mockResolvedValue(undefined),
};

describe('TablesService', () => {
  let service: TablesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new TablesService(prisma as any, mockPlanLimitService as any);
    jest.clearAllMocks();
    mockPlanLimitService.assertTableLimit.mockResolvedValue(undefined);
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('throws ForbiddenException when tenantId is missing', async () => {
      await expect(service.findAll(undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns only non-deleted tables for the tenant', async () => {
      prisma.table.findMany.mockResolvedValue([TABLE]);
      await service.findAll(T);
      const call = prisma.table.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.where.deletedAt).toBeNull();
    });

    it('orders tables by number ascending', async () => {
      prisma.table.findMany.mockResolvedValue([]);
      await service.findAll(T);
      expect(prisma.table.findMany.mock.calls[0][0].orderBy).toEqual({
        number: 'asc',
      });
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('throws ForbiddenException when tenantId is missing', async () => {
      await expect(service.findOne(undefined, 'tbl-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('queries with both id and tenantId for isolation', async () => {
      prisma.table.findFirst.mockResolvedValue(TABLE);
      await service.findOne(T, 'tbl-1');
      const call = prisma.table.findFirst.mock.calls[0][0];
      expect(call.where.id).toBe('tbl-1');
      expect(call.where.tenantId).toBe(T);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { number: 5, seats: 4 };

    it('checks plan limit before creating', async () => {
      prisma.table.findFirst.mockResolvedValue(null);
      prisma.table.create.mockResolvedValue(TABLE);

      await service.create(T, dto as any);
      expect(mockPlanLimitService.assertTableLimit).toHaveBeenCalledWith(T);
    });

    it('throws ConflictException when table number already exists', async () => {
      prisma.table.findFirst.mockResolvedValue(TABLE); // existing table

      await expect(service.create(T, dto as any)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.table.create).not.toHaveBeenCalled();
    });

    it('does not create when plan limit is exceeded', async () => {
      mockPlanLimitService.assertTableLimit.mockRejectedValue(
        new ForbiddenException('Quota atteint'),
      );

      await expect(service.create(T, dto as any)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.table.findFirst).not.toHaveBeenCalled();
    });

    it('creates table with tenantId', async () => {
      prisma.table.findFirst.mockResolvedValue(null);
      prisma.table.create.mockResolvedValue(TABLE);

      await service.create(T, dto as any);
      const call = prisma.table.create.mock.calls[0][0];
      expect(call.data.tenantId).toBe(T);
      expect(call.data.number).toBe(5);
    });
  });

  // ─── remove (soft delete) ─────────────────────────────────────────────────

  describe('remove', () => {
    it('throws ForbiddenException when tenantId is missing', async () => {
      await expect(service.remove(undefined, 'tbl-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('soft-deletes by setting deletedAt', async () => {
      prisma.table.update.mockResolvedValue({
        ...TABLE,
        deletedAt: new Date(),
      });

      await service.remove(T, 'tbl-1');

      const call = prisma.table.update.mock.calls[0][0];
      expect(call.data.deletedAt).toBeInstanceOf(Date);
      expect(call.where.tenantId).toBe(T);
    });
  });
});
