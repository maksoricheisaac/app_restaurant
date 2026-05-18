import { ForbiddenException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const T = 'tenant-1';
const CUSTOMER = { id: 'cust-1', name: 'Alice', email: 'alice@test.com', tenantId: T, deletedAt: null };

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new CustomersService(prisma as any);
    jest.clearAllMocks();
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('throws ForbiddenException when tenantId is missing', async () => {
      await expect(service.findAll(undefined, {})).rejects.toThrow(ForbiddenException);
    });

    it('returns paginated result with tenant isolation', async () => {
      prisma.customer.findMany.mockResolvedValue([CUSTOMER]);
      prisma.customer.count.mockResolvedValue(1);

      const result = await service.findAll(T, { page: 1, limit: 10 });

      expect(result.data).toEqual([CUSTOMER]);
      expect(result.pagination.total).toBe(1);
      const call = prisma.customer.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.where.deletedAt).toBeNull();
    });

    it('applies search filter across name, email, phone', async () => {
      prisma.customer.findMany.mockResolvedValue([]);
      prisma.customer.count.mockResolvedValue(0);

      await service.findAll(T, { search: 'alice', page: 1, limit: 10 });

      const call = prisma.customer.findMany.mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
      expect(call.where.OR).toHaveLength(3);
    });

    it('respects pagination limits (max 100)', async () => {
      prisma.customer.findMany.mockResolvedValue([]);
      prisma.customer.count.mockResolvedValue(0);

      await service.findAll(T, { page: 1, limit: 999 });

      const call = prisma.customer.findMany.mock.calls[0][0];
      expect(call.take).toBe(100);
    });

    it('calculates skip correctly for page 2', async () => {
      prisma.customer.findMany.mockResolvedValue([]);
      prisma.customer.count.mockResolvedValue(0);

      await service.findAll(T, { page: 2, limit: 10 });

      const call = prisma.customer.findMany.mock.calls[0][0];
      expect(call.skip).toBe(10);
    });

    it('orders by createdAt descending by default', async () => {
      prisma.customer.findMany.mockResolvedValue([]);
      prisma.customer.count.mockResolvedValue(0);

      await service.findAll(T, {});
      const call = prisma.customer.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual({ createdAt: 'desc' });
    });
  });
});
