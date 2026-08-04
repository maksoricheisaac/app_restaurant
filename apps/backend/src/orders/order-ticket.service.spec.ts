import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { OrderLineStatus } from '@prisma/client';
import { OrderTicketService } from './order-ticket.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const mockEventsService = {
  emitToStaff: jest.fn(),
  emitToOrderTracking: jest.fn(),
};
const mockInventoryService = {
  decrementStockForOrder: jest.fn().mockResolvedValue([]),
  restoreStockForLine: jest.fn().mockResolvedValue(undefined),
};
const mockPricing = { priceLines: jest.fn() };
const mockAudit = { recordDetached: jest.fn(), record: jest.fn() };
const mockTaxResolver = {
  getPolicy: jest.fn().mockResolvedValue({
    defaultRate: 0,
    pricesIncludeTax: true,
  }),
};

const ACTOR = { id: 'user-1', email: 'chef@resto.fr', role: 'manager' };

const line = (
  id: string,
  status: OrderLineStatus,
  overrides: Record<string, unknown> = {},
) => ({
  id,
  orderId: 'order-1',
  menuItemId: 'item-1',
  name: 'Poulet braisé',
  quantity: 1,
  price: 2500,
  status,
  taxRate: 0,
  lineExclTax: 2500,
  lineTax: 0,
  lineInclTax: 2500,
  ...overrides,
});

/**
 * Vie d'un ticket ouvert.
 *
 * C'est la brique qui rendait le service à table impossible : jusqu'ici, une
 * commande était figée à sa création. Ces tests fixent les trois invariants
 * qui la tiennent — statut dérivé, stock aligné sur l'envoi en cuisine,
 * verrouillage à l'encaissement.
 */
describe('OrderTicketService', () => {
  let service: OrderTicketService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new OrderTicketService(
      prisma as any,
      mockEventsService as any,
      mockInventoryService as any,
      mockPricing as any,
      mockAudit as any,
      mockTaxResolver as any,
    );
    jest.clearAllMocks();
    mockInventoryService.decrementStockForOrder.mockResolvedValue([]);
    mockInventoryService.restoreStockForLine.mockResolvedValue(undefined);
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
    // `recalculate` relit le ticket puis le met à jour.
    prisma.order.findUniqueOrThrow = jest.fn().mockResolvedValue({
      id: 'order-1',
      deliveryFee: null,
      deliveryTaxRate: 0,
      taxIncluded: true,
      closedAt: null,
      orderItems: [line('l1', 'sent')],
    });
    prisma.order.update.mockResolvedValue({
      id: 'order-1',
      status: 'pending',
      total: 2500,
    });
  });

  /** Ticket tel que le renvoie `loadOpenOrder`. */
  const openTicket = (lines: any[], overrides: Record<string, unknown> = {}) =>
    prisma.order.findFirst.mockResolvedValue({
      id: 'order-1',
      status: 'open',
      total: 2500,
      closedAt: null,
      deletedAt: null,
      type: 'dine_in',
      taxIncluded: true,
      deliveryTaxRate: 0,
      orderItems: lines,
      ...overrides,
    });

  // ─── Verrouillage ─────────────────────────────────────────────────────────

  describe('verrouillage après encaissement', () => {
    it.each([
      [
        'addLines',
        () => service.addLines('order-1', [{ quantity: 1 }], {}, ACTOR),
      ],
      ['sendToKitchen', () => service.sendToKitchen('order-1', ACTOR)],
      [
        'voidLine',
        () => service.voidLine('order-1', 'l1', 'erreur de saisie', ACTOR),
      ],
      [
        'removeDraftLine',
        () => service.removeDraftLine('order-1', 'l1', ACTOR),
      ],
      [
        'advanceLine',
        () =>
          service.advanceLine('order-1', 'l1', OrderLineStatus.ready, ACTOR),
      ],
    ])('%s refuse un ticket encaissé', async (_name, call) => {
      openTicket([line('l1', 'served')], {
        status: 'paid',
        closedAt: new Date(),
      });

      await expect(call()).rejects.toThrow(ConflictException);
    });

    it('refuse une opération sur un ticket introuvable', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.sendToKitchen('inconnu', ACTOR)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── Ajout d'une tournée ──────────────────────────────────────────────────

  describe('ajout de lignes', () => {
    beforeEach(() => {
      openTicket([line('l1', 'sent')]);
      mockPricing.priceLines.mockResolvedValue([
        {
          menuItemId: 'item-2',
          name: 'Tarte',
          quantity: 2,
          price: 1500,
          image: null,
          options: undefined,
          taxRate: 0,
          lineExclTax: 3000,
          lineTax: 0,
          lineInclTax: 3000,
        },
      ]);
      prisma.orderLine.create.mockResolvedValue({ id: 'l2' });
    });

    it('ajoute en brouillon par défaut — le serveur compose puis envoie', async () => {
      await service.addLines('order-1', [
        { menuItemId: 'item-2', quantity: 2 },
      ]);

      const created = prisma.orderLine.create.mock.calls[0][0].data;
      expect(created.status).toBe('draft');
      expect(created.sentAt).toBeNull();
      expect(
        mockInventoryService.decrementStockForOrder,
      ).not.toHaveBeenCalled();
    });

    it('envoie immédiatement quand le comptoir le demande', async () => {
      await service.addLines(
        'order-1',
        [{ menuItemId: 'item-2', quantity: 2 }],
        { sendImmediately: true },
      );

      const created = prisma.orderLine.create.mock.calls[0][0].data;
      expect(created.status).toBe('sent');
      expect(created.sentAt).toBeInstanceOf(Date);
      expect(mockInventoryService.decrementStockForOrder).toHaveBeenCalled();
    });

    it('applique la tarification serveur aux lignes ajoutées', async () => {
      await service.addLines('order-1', [
        { menuItemId: 'item-2', quantity: 2 },
      ]);

      expect(mockPricing.priceLines).toHaveBeenCalledWith(
        [{ menuItemId: 'item-2', quantity: 2 }],
        'pos',
        // Le régime de prix vient du ticket, pas du paramétrage courant.
        expect.objectContaining({
          pricesIncludeTax: true,
          serviceType: 'dine_in',
        }),
      );
      expect(prisma.orderLine.create.mock.calls[0][0].data.price).toBe(1500);
    });

    it('consigne l’ajout dans la piste d’audit', async () => {
      await service.addLines(
        'order-1',
        [{ menuItemId: 'item-2', quantity: 2 }],
        {},
        ACTOR,
      );

      expect(mockAudit.recordDetached).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'order.lines_added',
          entityId: 'order-1',
          userId: ACTOR.id,
        }),
      );
    });
  });

  // ─── Correction d'un brouillon ────────────────────────────────────────────

  describe('correction d’un brouillon', () => {
    it('change la quantité d’une ligne non envoyée', async () => {
      openTicket([line('l1', 'draft')]);
      prisma.orderLine.findFirst.mockResolvedValue(line('l1', 'draft'));

      await service.updateDraftLineQuantity('order-1', 'l1', 3, ACTOR);

      expect(prisma.orderLine.update).toHaveBeenCalledWith({
        where: { id: 'l1' },
        data: expect.objectContaining({ quantity: 3 }),
      });
    });

    it('reventile la taxe quand la quantité change', async () => {
      // La ventilation porte sur la ligne entière : la laisser figée sur
      // l'ancienne quantité ferait diverger le ticket de son détail.
      openTicket([line('l1', 'draft')], { taxIncluded: true });
      prisma.orderLine.findFirst.mockResolvedValue(
        line('l1', 'draft', { price: 120, taxRate: 20 }),
      );

      await service.updateDraftLineQuantity('order-1', 'l1', 3, ACTOR);

      const data = prisma.orderLine.update.mock.calls[0][0].data;
      expect(data.lineInclTax).toBe(360); // 3 × 120 TTC
      expect(data.lineExclTax).toBe(300);
      expect(data.lineTax).toBe(60);
    });

    it('refuse de modifier une ligne déjà partie en cuisine', async () => {
      openTicket([line('l1', 'sent')]);
      prisma.orderLine.findFirst.mockResolvedValue(line('l1', 'sent'));

      await expect(
        service.updateDraftLineQuantity('order-1', 'l1', 3, ACTOR),
      ).rejects.toThrow(ConflictException);
    });

    it('refuse une quantité nulle ou négative', async () => {
      await expect(
        service.updateDraftLineQuantity('order-1', 'l1', 0, ACTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('supprime une ligne encore en brouillon sans laisser de trace', async () => {
      openTicket([line('l1', 'draft')]);
      prisma.orderLine.findFirst.mockResolvedValue(line('l1', 'draft'));

      await service.removeDraftLine('order-1', 'l1', ACTOR);

      expect(prisma.orderLine.delete).toHaveBeenCalledWith({
        where: { id: 'l1' },
      });
      // Rien n'a été consommé : rien à restituer.
      expect(mockInventoryService.restoreStockForLine).not.toHaveBeenCalled();
    });

    it('refuse de supprimer une ligne partie en cuisine', async () => {
      openTicket([line('l1', 'sent')]);
      prisma.orderLine.findFirst.mockResolvedValue(line('l1', 'sent'));

      await expect(
        service.removeDraftLine('order-1', 'l1', ACTOR),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── Annulation motivée ───────────────────────────────────────────────────

  describe('annulation d’une ligne partie', () => {
    beforeEach(() => {
      openTicket([line('l1', 'sent')]);
      prisma.orderLine.findFirst.mockResolvedValue(line('l1', 'sent'));
    });

    it('exige un motif', async () => {
      await expect(
        service.voidLine('order-1', 'l1', '   ', ACTOR),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.orderLine.update).not.toHaveBeenCalled();
    });

    it('trace le motif et son auteur', async () => {
      await service.voidLine(
        'order-1',
        'l1',
        'Plat renvoyé par le client',
        ACTOR,
      );

      const data = prisma.orderLine.update.mock.calls[0][0].data;
      expect(data.status).toBe('cancelled');
      expect(data.cancelReason).toBe('Plat renvoyé par le client');
      expect(data.cancelledBy).toBe(ACTOR.id);
      expect(data.cancelledAt).toBeInstanceOf(Date);
    });

    it('restitue le stock consommé à l’envoi', async () => {
      await service.voidLine('order-1', 'l1', 'Erreur de saisie', ACTOR);

      expect(mockInventoryService.restoreStockForLine).toHaveBeenCalledWith(
        prisma,
        'order-1',
        expect.objectContaining({
          menuItemId: 'item-1',
          quantity: 1,
          reason: 'Erreur de saisie',
        }),
      );
    });

    it('renvoie vers la suppression pour une ligne encore en brouillon', async () => {
      openTicket([line('l1', 'draft')]);
      prisma.orderLine.findFirst.mockResolvedValue(line('l1', 'draft'));

      await expect(
        service.voidLine('order-1', 'l1', 'Erreur', ACTOR),
      ).rejects.toThrow(ConflictException);
    });

    it('refuse une deuxième annulation', async () => {
      openTicket([line('l1', 'cancelled')]);
      prisma.orderLine.findFirst.mockResolvedValue(line('l1', 'cancelled'));

      await expect(
        service.voidLine('order-1', 'l1', 'Erreur', ACTOR),
      ).rejects.toThrow(ConflictException);
    });

    it('consigne l’annulation dans la piste d’audit', async () => {
      await service.voidLine('order-1', 'l1', 'Plat renvoyé', ACTOR);

      expect(mockAudit.recordDetached).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'order.line_voided',
          userId: ACTOR.id,
          after: expect.objectContaining({ reason: 'Plat renvoyé' }),
        }),
      );
    });
  });

  // ─── Envoi en cuisine ─────────────────────────────────────────────────────

  describe('envoi en cuisine', () => {
    it('fait partir toutes les lignes en brouillon d’un seul geste', async () => {
      openTicket([
        line('l1', 'draft'),
        line('l2', 'draft'),
        line('l3', 'sent'),
      ]);

      await service.sendToKitchen('order-1', ACTOR);

      const call = prisma.orderLine.updateMany.mock.calls[0][0];
      expect(call.where).toEqual({ orderId: 'order-1', status: 'draft' });
      expect(call.data.status).toBe('sent');
      expect(call.data.sentAt).toBeInstanceOf(Date);
    });

    it('consomme le stock des seules lignes qui partent', async () => {
      openTicket([line('l1', 'draft'), line('l2', 'sent')]);

      await service.sendToKitchen('order-1', ACTOR);

      expect(mockInventoryService.decrementStockForOrder).toHaveBeenCalledWith(
        prisma,
        'order-1',
        [{ menuItemId: 'item-1', quantity: 1 }],
      );
    });

    it('refuse quand il n’y a rien à envoyer', async () => {
      openTicket([line('l1', 'sent')]);

      await expect(service.sendToKitchen('order-1', ACTOR)).rejects.toThrow(
        ConflictException,
      );
    });

    it('prévient la cuisine', async () => {
      openTicket([line('l1', 'draft')]);

      await service.sendToKitchen('order-1', ACTOR);

      expect(mockEventsService.emitToStaff).toHaveBeenCalledWith(
        'new-order',
        expect.any(Object),
      );
    });
  });

  // ─── Avancement ───────────────────────────────────────────────────────────

  describe('avancement des lignes', () => {
    it('fait avancer une ligne selon la machine d’état', async () => {
      openTicket([line('l1', 'sent')]);
      prisma.orderLine.findFirst.mockResolvedValue(line('l1', 'sent'));

      await service.advanceLine(
        'order-1',
        'l1',
        OrderLineStatus.preparing,
        ACTOR,
      );

      expect(prisma.orderLine.update).toHaveBeenCalledWith({
        where: { id: 'l1' },
        data: { status: 'preparing' },
      });
    });

    it('refuse un retour en arrière', async () => {
      openTicket([line('l1', 'ready')]);
      prisma.orderLine.findFirst.mockResolvedValue(line('l1', 'ready'));

      await expect(
        service.advanceLine('order-1', 'l1', OrderLineStatus.preparing, ACTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('renvoie l’annulation vers la route dédiée, qui exige un motif', async () => {
      await expect(
        service.advanceLine('order-1', 'l1', OrderLineStatus.cancelled, ACTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('avance d’un geste toutes les lignes éligibles du ticket', async () => {
      openTicket([
        line('l1', 'sent'),
        line('l2', 'preparing'),
        line('l3', 'cancelled'),
      ]);

      await service.advanceAllLines('order-1', OrderLineStatus.ready, ACTOR);

      const call = prisma.orderLine.updateMany.mock.calls[0][0];
      // La ligne annulée est exclue : elle ne peut plus avancer.
      expect(call.where.id.in).toEqual(['l1', 'l2']);
      expect(call.data.status).toBe('ready');
    });

    it('refuse quand aucune ligne ne peut avancer', async () => {
      openTicket([line('l1', 'cancelled')]);

      await expect(
        service.advanceAllLines('order-1', OrderLineStatus.ready, ACTOR),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Annulation du ticket ─────────────────────────────────────────────────

  describe('annulation du ticket', () => {
    it('exige un motif', async () => {
      openTicket([line('l1', 'sent')]);

      await expect(service.cancelOrder('order-1', '', ACTOR)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('annule toutes les lignes et restitue le stock des lignes parties', async () => {
      openTicket([line('l1', 'sent'), line('l2', 'draft')]);

      await service.cancelOrder('order-1', 'Client parti', ACTOR);

      const call = prisma.orderLine.updateMany.mock.calls[0][0];
      expect(call.data.status).toBe('cancelled');
      expect(call.data.cancelReason).toBe('Client parti');
      // Seule la ligne partie avait consommé du stock.
      expect(mockInventoryService.restoreStockForLine).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Invariant central ────────────────────────────────────────────────────

  describe('recalcul après chaque opération', () => {
    it('recalcule total et statut depuis les lignes', async () => {
      openTicket([line('l1', 'draft')]);
      prisma.order.findUniqueOrThrow = jest.fn().mockResolvedValue({
        id: 'order-1',
        deliveryFee: 500,
        deliveryTaxRate: 0,
        taxIncluded: true,
        closedAt: null,
        orderItems: [
          {
            status: 'served',
            taxRate: 0,
            lineExclTax: 5000,
            lineTax: 0,
            lineInclTax: 5000,
          },
          {
            status: 'cancelled',
            taxRate: 0,
            lineExclTax: 9000,
            lineTax: 0,
            lineInclTax: 9000,
          },
        ],
      });

      await service.sendToKitchen('order-1', ACTOR);

      const data = prisma.order.update.mock.calls[0][0].data;
      // 5000 de lignes actives + 500 de livraison ; l'annulée est exclue.
      expect(data.total).toBe(5500);
      expect(data.subtotalExclTax).toBe(5500);
      expect(data.taxTotal).toBe(0);
      expect(data.status).toBe('served');
    });

    it('ne laisse jamais l’appelant poser le statut lui-même', async () => {
      openTicket([line('l1', 'draft')]);

      await service.sendToKitchen('order-1', ACTOR);

      // Le seul update du ticket est celui du recalcul.
      expect(prisma.order.update).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Lecture ──────────────────────────────────────────────────────────────

  it('ne liste comme ouverts que les tickets non clos', async () => {
    prisma.order.findMany.mockResolvedValue([]);

    await service.findOpen();

    const where = prisma.order.findMany.mock.calls[0][0].where;
    expect(where.closedAt).toBeNull();
    expect(where.deletedAt).toBeNull();
    expect(where.status.notIn).toEqual(['paid', 'cancelled']);
  });
});
