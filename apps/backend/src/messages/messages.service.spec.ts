import { NotFoundException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { createMockPrisma } from '../__tests__/prisma.mock';

const T = 'tenant-1';
const MSG = {
  id: 'msg-1',
  tenantId: T,
  customerName: 'Alice',
  email: 'alice@test.com',
  message: 'Bonjour',
  read: false,
  deletedAt: null,
};

// MessagesService mock setup — message is not in the standard MockPrisma
// We extend the mock with the 'message' model
function buildService() {
  const prisma = createMockPrisma() as any;
  prisma.message = {
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  return { service: new MessagesService(prisma), prisma };
}

describe('MessagesService', () => {
  let service: MessagesService;
  let prisma: any;

  beforeEach(() => {
    ({ service, prisma } = buildService());
    jest.clearAllMocks();
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('queries non-deleted messages for tenant', async () => {
      prisma.message.findMany.mockResolvedValue([MSG]);
      prisma.message.count.mockResolvedValue(1);

      const result = await service.findAll(T);

      const call = prisma.message.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.where.deletedAt).toBeNull();
      expect(call.orderBy).toEqual({ createdAt: 'desc' });
      expect(result.data).toEqual([MSG]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      });
    });

    it('applies pagination params', async () => {
      prisma.message.findMany.mockResolvedValue([]);
      prisma.message.count.mockResolvedValue(45);

      await service.findAll(T, { page: 2, limit: 10 });

      const call = prisma.message.findMany.mock.calls[0][0];
      expect(call.skip).toBe(10);
      expect(call.take).toBe(10);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('throws NotFoundException for non-existent message', async () => {
      prisma.message.findFirst.mockResolvedValue(null);
      await expect(service.findOne(T, 'ghost')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('filters by id and tenantId', async () => {
      prisma.message.findFirst.mockResolvedValue(MSG);
      await service.findOne(T, 'msg-1');
      const call = prisma.message.findFirst.mock.calls[0][0];
      expect(call.where.id).toBe('msg-1');
      expect(call.where.tenantId).toBe(T);
    });

    it('cannot access message from another tenant', async () => {
      prisma.message.findFirst.mockResolvedValue(null);
      await expect(service.findOne('other-tenant', 'msg-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates message with tenantId', async () => {
      prisma.message.create.mockResolvedValue(MSG);

      await service.create(T, {
        customerName: 'Alice',
        email: 'alice@test.com',
        message: 'Bonjour',
      } as any);

      const call = prisma.message.create.mock.calls[0][0];
      expect(call.data.tenantId).toBe(T);
    });
  });

  // ─── remove (soft delete) ─────────────────────────────────────────────────

  describe('remove', () => {
    it('throws NotFoundException when message not found', async () => {
      prisma.message.findFirst.mockResolvedValue(null);
      await expect(service.remove(T, 'ghost')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('soft-deletes message by setting deletedAt', async () => {
      prisma.message.findFirst.mockResolvedValue(MSG);
      prisma.message.update.mockResolvedValue({
        ...MSG,
        deletedAt: new Date(),
      });

      await service.remove(T, 'msg-1');

      const call = prisma.message.update.mock.calls[0][0];
      expect(call.data.deletedAt).toBeInstanceOf(Date);
    });
  });
});
