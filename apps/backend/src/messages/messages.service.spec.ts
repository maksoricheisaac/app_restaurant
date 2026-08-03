import { NotFoundException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { createMockPrisma } from '../__tests__/prisma.mock';

const MSG = {
  id: 'msg-1',
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
    it('applies pagination params', async () => {
      prisma.message.findMany.mockResolvedValue([]);
      prisma.message.count.mockResolvedValue(45);

      await service.findAll({ page: 2, limit: 10 });

      const call = prisma.message.findMany.mock.calls[0][0];
      expect(call.skip).toBe(10);
      expect(call.take).toBe(10);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('throws NotFoundException for non-existent message', async () => {
      prisma.message.findFirst.mockResolvedValue(null);
      await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {});

  // ─── remove (soft delete) ─────────────────────────────────────────────────

  describe('remove', () => {
    it('throws NotFoundException when message not found', async () => {
      prisma.message.findFirst.mockResolvedValue(null);
      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });

    it('soft-deletes message by setting deletedAt', async () => {
      prisma.message.findFirst.mockResolvedValue(MSG);
      prisma.message.update.mockResolvedValue({
        ...MSG,
        deletedAt: new Date(),
      });

      await service.remove('msg-1');

      const call = prisma.message.update.mock.calls[0][0];
      expect(call.data.deletedAt).toBeInstanceOf(Date);
    });
  });
});
