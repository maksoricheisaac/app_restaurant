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
const mockRestaurantService = {
  getPublicProfile: jest.fn().mockResolvedValue({
    name: 'Test Restaurant',
    dineInEnabled: true,
    takeawayEnabled: true,
    deliveryEnabled: false,
    maxReservationGuests: 20,
    maxDaysInAdvance: 30,
  }),
};

function buildController(prisma: MockPrisma) {
  return new PublicMenuController(
    mockMenuService as any,
    prisma as any,
    mockRestaurantService as any,
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
    it('throws NotFoundException for unknown tableId', async () => {
      prisma.table.findFirst.mockResolvedValue(null);
      await expect(controller.findByTableId('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── findBySlug ───────────────────────────────────────────────────────────

  describe('findBySlug', () => {});

  // ─── createOrder — delegates to PublicOrderService ────────────────────────

  describe('createOrder', () => {
    it('delegates entirely to PublicOrderService', async () => {
      const expected = { orderId: 'o1', status: 'pending', total: 5000 };
      mockPublicOrderService.createOrder.mockResolvedValue(expected);

      const dto = {
        type: 'dine_in',
        items: [{ menuItemId: 'item-1', quantity: 2 }],
      } as any;
      const result = await controller.createOrder(dto, 'test-token');

      expect(mockPublicOrderService.createOrder).toHaveBeenCalledWith(
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
        controller.createReservation(dto as any, 'bad-token'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockReservationsService.create).not.toHaveBeenCalled();
    });

    it('sanitizes customerName to prevent stored XSS', async () => {
      mockReservationsService.create.mockResolvedValue({ id: 'res-1' });

      await controller.createReservation(
        { ...dto, customerName: '<script>alert(1)</script>Alice' } as any,
        'test-token',
      );

      const call = mockReservationsService.create.mock.calls[0][0];
      expect(call.customerName).not.toContain('<script>');
    });
  });
});
