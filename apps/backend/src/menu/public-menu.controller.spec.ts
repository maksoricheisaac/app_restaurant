import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PublicMenuController } from './public-menu.controller';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const mockMenuService = { findPublicMenu: jest.fn().mockResolvedValue([]) };
const mockPublicOrderService = { createOrder: jest.fn() };
const mockMenuSessionService = {
  generate: jest.fn().mockReturnValue('test-token'),
  verify: jest.fn().mockReturnValue(true),
};
const mockReservationsService = { create: jest.fn() };

function buildController(prisma: MockPrisma) {
  return new PublicMenuController(
    mockMenuService as any,
    prisma as any,
    mockPublicOrderService as any,
    mockMenuSessionService as any,
    mockReservationsService as any,
  );
}

describe('PublicMenuController', () => {
  let controller: PublicMenuController;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    controller = buildController(prisma);
    jest.clearAllMocks();
    mockMenuSessionService.verify.mockReturnValue(true);
  });

  // ─── findByTableId ────────────────────────────────────────────────────────

  describe('findByTableId', () => {
    it('returns slug and tableNumber for a valid table', async () => {
      prisma.table.findUnique.mockResolvedValue({
        id: 'table-1',
        number: 5,
        tenant: { slug: 'le-maquis', name: 'Le Maquis' },
      });

      const result = await controller.findByTableId('table-1');

      expect(result.slug).toBe('le-maquis');
      expect(result.tableNumber).toBe(5);
    });

    it('throws NotFoundException for unknown tableId', async () => {
      prisma.table.findUnique.mockResolvedValue(null);
      await expect(controller.findByTableId('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── findBySlug ───────────────────────────────────────────────────────────

  describe('findBySlug', () => {
    it('returns tenant + menu for a valid slug', async () => {
      const tenant = {
        id: 'tenant-1',
        name: 'Le Maquis',
        slug: 'le-maquis',
        logo: null,
      };
      prisma.tenant.findFirst.mockResolvedValue(tenant);

      const result = await controller.findBySlug('le-maquis');

      expect(result.tenant).toEqual({ ...tenant, settings: null });
      expect(mockMenuService.findPublicMenu).toHaveBeenCalledWith('tenant-1');
    });

    it('throws NotFoundException for unknown slug', async () => {
      prisma.tenant.findFirst.mockResolvedValue(null);
      await expect(controller.findBySlug('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── createOrder — delegates to PublicOrderService ────────────────────────

  describe('createOrder', () => {
    it('delegates entirely to PublicOrderService', async () => {
      const expected = { orderId: 'o1', status: 'pending', total: 5000 };
      mockPublicOrderService.createOrder.mockResolvedValue(expected);

      const dto = {
        type: 'dine_in',
        items: [{ menuItemId: 'item-1', quantity: 2 }],
      } as any;
      const result = await controller.createOrder(
        'le-maquis',
        dto,
        'test-token',
      );

      expect(mockPublicOrderService.createOrder).toHaveBeenCalledWith(
        'le-maquis',
        dto,
        'test-token',
      );
      expect(result).toEqual(expected);
    });

    it('propagates errors from PublicOrderService', async () => {
      mockPublicOrderService.createOrder.mockRejectedValue(
        new NotFoundException('Restaurant introuvable'),
      );
      await expect(
        controller.createOrder(
          'unknown',
          { type: 'dine_in', items: [] } as any,
          undefined,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── createReservation ────────────────────────────────────────────────────

  describe('createReservation', () => {
    const dto = {
      date: '2026-06-15T19:00:00.000Z',
      time: '19:00',
      guests: 2,
      customerName: 'Alice',
      email: 'alice@test.com',
    };

    it('rejects an invalid/expired menu session token', async () => {
      mockMenuSessionService.verify.mockReturnValue(false);

      await expect(
        controller.createReservation('le-maquis', dto as any, 'bad-token'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockReservationsService.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown restaurant slug', async () => {
      prisma.tenant.findFirst.mockResolvedValue(null);

      await expect(
        controller.createReservation('unknown', dto as any, 'test-token'),
      ).rejects.toThrow(NotFoundException);
    });

    it('delegates to ReservationsService with the resolved tenant, never a client-supplied tableId/status', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1' });
      mockReservationsService.create.mockResolvedValue({ id: 'res-1' });

      await controller.createReservation('le-maquis', dto as any, 'test-token');

      const call = mockReservationsService.create.mock.calls[0];
      expect(call[0]).toBe('tenant-1');
      expect(call[1]).not.toHaveProperty('tableId');
      expect(call[1]).not.toHaveProperty('status');
      expect(call[1].customerName).toBe('Alice');
    });

    it('sanitizes customerName to prevent stored XSS', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1' });
      mockReservationsService.create.mockResolvedValue({ id: 'res-1' });

      await controller.createReservation(
        'le-maquis',
        { ...dto, customerName: '<script>alert(1)</script>Alice' } as any,
        'test-token',
      );

      const call = mockReservationsService.create.mock.calls[0][1];
      expect(call.customerName).not.toContain('<script>');
    });
  });
});
