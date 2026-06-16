import {
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const T = 'tenant-1';
const RES = {
  id: 'res-1',
  date: new Date('2026-06-15'),
  tenantId: T,
  status: 'pending',
  guests: 4,
};

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: MockPrisma;

  const mockCustomersService = {
    upsertFromInteraction: jest.fn().mockResolvedValue(null),
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    // $transaction exécute le callback directement pour les tests unitaires
    (prisma.$transaction as jest.Mock).mockImplementation((cb: any) =>
      cb(prisma),
    );
    service = new ReservationsService(
      prisma as any,
      mockCustomersService as any,
    );
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation((cb: any) =>
      cb(prisma),
    );
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('throws ForbiddenException when tenantId is missing', async () => {
      await expect(service.findAll(undefined, {})).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('queries reservations for the tenant only (excludes soft-deleted)', async () => {
      prisma.reservation.findMany.mockResolvedValue([RES]);

      await service.findAll(T, {});

      const call = prisma.reservation.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.where.deletedAt).toBe(null);
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
      prisma.reservation.findFirst.mockResolvedValue(null); // no conflict
      prisma.reservation.create.mockResolvedValue(RES);

      await service.create(T, dto as any);

      const call = prisma.reservation.create.mock.calls[0][0];
      expect(call.data.tenantId).toBe(T);
    });

    it('converts date string to Date object', async () => {
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.reservation.create.mockResolvedValue(RES);

      await service.create(T, dto as any);

      const call = prisma.reservation.create.mock.calls[0][0];
      expect(call.data.date).toBeInstanceOf(Date);
    });

    it('assigns userId when provided', async () => {
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.reservation.create.mockResolvedValue(RES);

      await service.create(T, dto as any, 'user-1');

      const call = prisma.reservation.create.mock.calls[0][0];
      expect(call.data.userId).toBe('user-1');
    });

    it('throws ConflictException when table already booked for same slot', async () => {
      const dtoWithTable = {
        ...dto,
        tableId: 'table-1',
        time: '19:00',
      };

      // Conflict trouvé en base
      prisma.reservation.findFirst.mockResolvedValue({ id: 'existing-res' });

      await expect(service.create(T, dtoWithTable as any)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.reservation.create).not.toHaveBeenCalled();
    });

    it('allows booking same table at different time', async () => {
      const dtoWithTable = { ...dto, tableId: 'table-1', time: '21:00' };
      prisma.reservation.findFirst.mockResolvedValue(null); // no conflict
      prisma.reservation.create.mockResolvedValue(RES);

      await expect(
        service.create(T, dtoWithTable as any),
      ).resolves.toBeDefined();
    });
  });

  // ─── updateStatus ─────────────────────────────────────────────────────────

  describe('updateStatus — state machine', () => {
    it('throws ForbiddenException when tenantId is missing', async () => {
      await expect(
        service.updateStatus(undefined, 'res-1', {
          status: 'confirmed',
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows valid transition pending → confirmed', async () => {
      prisma.reservation.findFirst.mockResolvedValue({ status: 'pending' });
      prisma.reservation.update.mockResolvedValue({
        ...RES,
        status: 'confirmed',
      });

      await service.updateStatus(T, 'res-1', { status: 'confirmed' } as any);

      const call = prisma.reservation.update.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.data.status).toBe('confirmed');
    });

    it('allows valid transition pending → cancelled', async () => {
      prisma.reservation.findFirst.mockResolvedValue({ status: 'pending' });
      prisma.reservation.update.mockResolvedValue({
        ...RES,
        status: 'cancelled',
      });

      await service.updateStatus(T, 'res-1', { status: 'cancelled' } as any);

      expect(prisma.reservation.update).toHaveBeenCalled();
    });

    it('rejects invalid transition confirmed → pending (BadRequestException)', async () => {
      prisma.reservation.findFirst.mockResolvedValue({ status: 'confirmed' });

      await expect(
        service.updateStatus(T, 'res-1', { status: 'pending' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects any transition from terminal state cancelled', async () => {
      prisma.reservation.findFirst.mockResolvedValue({ status: 'cancelled' });

      await expect(
        service.updateStatus(T, 'res-1', { status: 'confirmed' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove — soft-delete', () => {
    it('throws ForbiddenException when tenantId is missing', async () => {
      await expect(service.remove(undefined, 'res-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('soft-deletes reservation (sets deletedAt, does NOT call delete)', async () => {
      prisma.reservation.update.mockResolvedValue({
        ...RES,
        deletedAt: new Date(),
      });

      await service.remove(T, 'res-1');

      expect(prisma.reservation.delete).not.toHaveBeenCalled();
      const call = prisma.reservation.update.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.where.id).toBe('res-1');
      expect(call.data.deletedAt).toBeInstanceOf(Date);
    });
  });
});
