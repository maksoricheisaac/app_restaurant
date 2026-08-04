import { OrdersService } from './orders.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';
import { OrderType } from './dto/create-order.dto';
import { OrderStatusTarget } from './dto/update-order-status.dto';

const mockOrderCreation = { create: jest.fn() };
const mockTicketService = {
  advanceAllLines: jest.fn(),
  cancelOrder: jest.fn(),
};

const ACTOR = { id: 'user-7', email: 'chef@resto.fr', role: 'manager' };

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new OrdersService(
      prisma as any,
      mockOrderCreation as any,
      mockTicketService as any,
    );
    jest.clearAllMocks();
    mockOrderCreation.create.mockResolvedValue({ id: 'order-1' });
    mockTicketService.advanceAllLines.mockResolvedValue({ id: 'order-1' });
    mockTicketService.cancelOrder.mockResolvedValue({ id: 'order-1' });
  });

  // ─── Adaptateur du comptoir ───────────────────────────────────────────────
  //
  // Le métier (prix, options, stock, cycle de vie) est couvert par les specs
  // de OrderLinePricingService, OrderCreationService et OrderTicketService.
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

    it('transmet le choix d’ouvrir un ticket sans l’envoyer en cuisine', async () => {
      await service.create(
        {
          type: OrderType.DINE_IN,
          items: [{ menuItemId: 'menu-1', quantity: 1 }],
          sendImmediately: false,
        } as any,
        'user-7',
      );

      expect(mockOrderCreation.create).toHaveBeenCalledWith(
        expect.objectContaining({ sendImmediately: false }),
      );
    });
  });

  // ─── Avancement au niveau du ticket ───────────────────────────────────────

  describe('updateStatus', () => {
    it.each([
      [OrderStatusTarget.PREPARING, 'preparing'],
      [OrderStatusTarget.READY, 'ready'],
      [OrderStatusTarget.SERVED, 'served'],
    ])(
      'traduit « %s » en avancement de toutes les lignes',
      async (target, expected) => {
        await service.updateStatus('order-1', { status: target }, ACTOR);

        expect(mockTicketService.advanceAllLines).toHaveBeenCalledWith(
          'order-1',
          expected,
          ACTOR,
        );
      },
    );

    it('route l’annulation vers le chemin motivé', async () => {
      await service.updateStatus(
        'order-1',
        { status: OrderStatusTarget.CANCELLED, reason: 'Client parti' },
        ACTOR,
      );

      expect(mockTicketService.cancelOrder).toHaveBeenCalledWith(
        'order-1',
        'Client parti',
        ACTOR,
      );
      expect(mockTicketService.advanceAllLines).not.toHaveBeenCalled();
    });
  });

  // ─── Écran cuisine ────────────────────────────────────────────────────────

  describe('findKitchenOrders', () => {
    it('filtre sur les lignes parties, pas sur le statut du ticket', async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.findKitchenOrders();

      const args = prisma.order.findMany.mock.calls[0][0];
      // Un ticket dont une tournée est en cours doit rester affiché même si
      // une nouvelle ligne vient d'être saisie en salle.
      expect(args.where.orderItems.some.status.in).toEqual([
        'sent',
        'preparing',
        'ready',
      ]);
      expect(args.where.closedAt).toBeNull();
      expect(args.where.status).toBeUndefined();
    });

    it('n’expose à la cuisine que les lignes concernées', async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.findKitchenOrders();

      const include = prisma.order.findMany.mock.calls[0][0].include;
      expect(include.orderItems.where.status.in).toEqual([
        'sent',
        'preparing',
        'ready',
      ]);
    });
  });

  // ─── Suivi public ─────────────────────────────────────────────────────────

  describe('getTracking', () => {
    it('masque au client les brouillons et les lignes annulées', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await service.getTracking('order-1');

      const select = prisma.order.findFirst.mock.calls[0][0].select;
      expect(select.orderItems.where.status.not).toBe('cancelled');
      expect(select.number).toBe(true);
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
