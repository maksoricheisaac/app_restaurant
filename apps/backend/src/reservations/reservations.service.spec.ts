import { ForbiddenException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const T = 'tenant-1';
const RES = { id: 'res-1', date: new Date('2026-06-15'), tenantId: T, status: 'pending', guests: 4 };

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ReservationsService(prisma as any);
    jest.clearAllMocks();
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('throws ForbiddenException when tenantId is missing', async () => {
      await expect(service.findAll(undefined, {})).rejects.toThrow(ForbiddenException);
    });

    it('queries reservations for the tenant only', async () => {
      prisma.reservation.findMany.mockResolvedValue([RES]);

      await service.findAll(T, {});

      const call = prisma.reservation.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
    });

    it('applies date filter when provided', async () => {
      prisma.reservation.findMany.mockResolvedValue([]);

      await service.findAll(T, { date: '2026-06-15' });

      const call = prisma.reservation.findMany.mock.calls[0][0];
      expect(call.where.date).toBeDefined();
    });

    it('applies status filter when provided', async () => {
      prisma.reservation.findMany.mockResolvedValue([]);

      await service.findAll(T, { status: 'confirmed' });

      const call = prisma.reservation.findMany.mock.calls[0][0];
      expect(call.where.status).toBe('confirmed');
    });

    it('orders by date ascending', async () => {
      prisma.reservation.findMany.mockResolvedValue([]);
      await service.findAll(T, {});
      const call = prisma.reservation.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual({ date: 'asc' });
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      date: '2026-06-15T19:00:00.000Z',
      guests: 4,
      customerName: 'Alice',
      email: 'alice@test.com',
    };

    it('creates reservation with tenantId', async () => {
      prisma.reservation.create.mockResolvedValue(RES);

      await service.create(T, dto as any);

      const call = prisma.reservation.create.mock.calls[0][0];
      expect(call.data.tenantId).toBe(T);
    });

    it('converts date string to Date object', async () => {
      prisma.reservation.create.mockResolvedValue(RES);

      await service.create(T, dto as any);

      const call = prisma.reservation.create.mock.calls[0][0];
      expect(call.data.date).toBeInstanceOf(Date);
    });

    it('assigns userId when provided', async () => {
      prisma.reservation.create.mockResolvedValue(RES);

      await service.create(T, dto as any, 'user-1');

      const call = prisma.reservation.create.mock.calls[0][0];
      expect(call.data.userId).toBe('user-1');
    });
  });

  // ─── updateStatus ─────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('throws ForbiddenException when tenantId is missing', async () => {
      await expect(
        service.updateStatus(undefined, 'res-1', { status: 'confirmed' } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates only reservation belonging to this tenant', async () => {
      prisma.reservation.update.mockResolvedValue({ ...RES, status: 'confirmed' });

      await service.updateStatus(T, 'res-1', { status: 'confirmed' } as any);

      const call = prisma.reservation.update.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.where.id).toBe('res-1');
      expect(call.data.status).toBe('confirmed');
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('throws ForbiddenException when tenantId is missing', async () => {
      await expect(service.remove(undefined, 'res-1')).rejects.toThrow(ForbiddenException);
    });

    it('hard-deletes the reservation from this tenant only', async () => {
      prisma.reservation.delete.mockResolvedValue(RES);

      await service.remove(T, 'res-1');

      const call = prisma.reservation.delete.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.where.id).toBe('res-1');
    });
  });
});
