import { OrdersService } from './orders.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';
import { OrderType } from './dto/create-order.dto';

const mockEventsService = {
  emitToStaff: jest.fn(),
  emitToOrderTracking: jest.fn(),
};
const mockOrderCreation = { create: jest.fn() };
const mockAuditService = { recordDetached: jest.fn(), record: jest.fn() };

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new OrdersService(
      prisma as any,
      mockEventsService as any,
      mockOrderCreation as any,
      mockAuditService as any,
    );
    jest.clearAllMocks();
    mockOrderCreation.create.mockResolvedValue({ id: 'order-1' });
  });

  // ─── Adaptateur du comptoir ───────────────────────────────────────────────
  //
  // Le métier (prix, options, stock) est couvert par
  // order-creation.service.spec.ts — le seul endroit où il vit désormais.
  // Ici on ne vérifie que la traduction du DTO.

  describe('create — adaptateur POS', () => {
    it('délègue au chemin unique de création avec le canal pos', async () => {
      await service.create(
        {
          type: OrderType.DINE_IN,
          items: [{ menuItemId: 'menu-1', quantity: 2 }],
        } as any,
        'user-7',
      );

      expect(mockOrderCreation.create).toHaveBeenCalledWith(
        expect.objectContaining({ channel: 'pos', userId: 'user-7' }),
      );
    });

    it('transmet les options choisies au comptoir', async () => {
      await service.create(
        {
          type: OrderType.DINE_IN,
          items: [
            {
              menuItemId: 'menu-1',
              quantity: 1,
              selectedOptionIds: ['opt-a', 'opt-b'],
            },
          ],
        } as any,
        'user-7',
      );

      const input = mockOrderCreation.create.mock.calls[0][0];
      expect(input.items[0].selectedOptionIds).toEqual(['opt-a', 'opt-b']);
    });
  });

  // ─── Machine d'état ───────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('accepte une transition autorisée et notifie les deux salons', async () => {
      prisma.order.findFirst.mockResolvedValue({ status: 'pending' });
      prisma.order.update.mockResolvedValue({ id: 'o1', status: 'preparing' });

      await service.updateStatus('o1', { status: 'preparing' } as any);

      expect(mockEventsService.emitToStaff).toHaveBeenCalledWith(
        'order-status-updated',
        { id: 'o1', status: 'preparing' },
      );
      expect(mockEventsService.emitToOrderTracking).toHaveBeenCalledWith(
        'o1',
        'status-update',
        { status: 'preparing' },
      );
    });

    it('refuse une transition interdite', async () => {
      prisma.order.findFirst.mockResolvedValue({ status: 'served' });

      await expect(
        service.updateStatus('o1', { status: 'preparing' } as any),
      ).rejects.toThrow(/Transition invalide/);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('refuse une commande introuvable', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus('inconnu', { status: 'preparing' } as any),
      ).rejects.toThrow(/introuvable/);
    });
  });

  describe('remove', () => {
    it('archive la commande au lieu de la supprimer', async () => {
      prisma.order.update.mockResolvedValue({ id: 'o1' });

      await service.remove('o1');

      const call = prisma.order.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'o1' });
      expect(call.data.deletedAt).toBeInstanceOf(Date);
    });
  });
});
