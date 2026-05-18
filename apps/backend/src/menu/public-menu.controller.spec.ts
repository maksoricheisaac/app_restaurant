import { NotFoundException } from '@nestjs/common';
import { PublicMenuController } from './public-menu.controller';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const mockMenuService = { findPublicMenu: jest.fn().mockResolvedValue([]) };
const mockPublicOrderService = { createOrder: jest.fn() };

function buildController(prisma: MockPrisma) {
  return new PublicMenuController(
    mockMenuService as any,
    prisma as any,
    mockPublicOrderService as any,
  );
}

describe('PublicMenuController', () => {
  let controller: PublicMenuController;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    controller = buildController(prisma);
    jest.clearAllMocks();
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
      await expect(controller.findByTableId('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findBySlug ───────────────────────────────────────────────────────────

  describe('findBySlug', () => {
    it('returns tenant + menu for a valid slug', async () => {
      const tenant = { id: 'tenant-1', name: 'Le Maquis', slug: 'le-maquis', logo: null };
      prisma.tenant.findUnique.mockResolvedValue(tenant);

      const result = await controller.findBySlug('le-maquis');

      expect(result.tenant).toEqual(tenant);
      expect(mockMenuService.findPublicMenu).toHaveBeenCalledWith('tenant-1');
    });

    it('throws NotFoundException for unknown slug', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);
      await expect(controller.findBySlug('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── createOrder — delegates to PublicOrderService ────────────────────────

  describe('createOrder', () => {
    it('delegates entirely to PublicOrderService', async () => {
      const expected = { orderId: 'o1', status: 'pending', total: 5000 };
      mockPublicOrderService.createOrder.mockResolvedValue(expected);

      const dto = { type: 'dine_in', items: [{ menuItemId: 'item-1', quantity: 2 }] } as any;
      const result = await controller.createOrder('le-maquis', dto);

      expect(mockPublicOrderService.createOrder).toHaveBeenCalledWith('le-maquis', dto);
      expect(result).toEqual(expected);
    });

    it('propagates errors from PublicOrderService', async () => {
      mockPublicOrderService.createOrder.mockRejectedValue(new NotFoundException('Restaurant introuvable'));
      await expect(
        controller.createOrder('unknown', { type: 'dine_in', items: [] } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
