import { BadRequestException } from '@nestjs/common';
import { OrderCreationService } from './order-creation.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const mockEventsService = { emitToStaff: jest.fn() };
const mockInventoryService = {
  decrementStockForOrder: jest.fn().mockResolvedValue([]),
};
const mockCustomersService = {
  upsertFromInteraction: jest.fn().mockResolvedValue(null),
};
const mockPricing = { priceLines: jest.fn() };
const mockNumbering = {
  serviceDateFor: jest.fn(),
  allocate: jest.fn(),
};
const mockTaxResolver = { getPolicy: jest.fn(), resolveRate: jest.fn() };

/** Régime par défaut des cas de test : prix TTC, sans taxe. */
const NO_TAX_POLICY = { defaultRate: 0, pricesIncludeTax: true };

const SERVICE_DATE = new Date('2026-08-03T00:00:00.000Z');

const PRICED_LINE = {
  menuItemId: 'item-1',
  name: 'Poulet braisé',
  quantity: 1,
  price: 2500,
  image: null,
  options: undefined,
  taxRate: 0,
  lineExclTax: 2500,
  lineTax: 0,
  lineInclTax: 2500,
};

/**
 * Ouverture d'un ticket : numérotation, moment du décrément de stock,
 * lignes en brouillon ou envoyées. La tarification est couverte par
 * order-line-pricing.service.spec.ts, dont ce service dépend.
 */
describe('OrderCreationService', () => {
  let service: OrderCreationService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new OrderCreationService(
      prisma as any,
      mockEventsService as any,
      mockCustomersService as any,
      mockInventoryService as any,
      mockPricing as any,
      mockNumbering as any,
      mockTaxResolver as any,
    );
    jest.clearAllMocks();
    mockInventoryService.decrementStockForOrder.mockResolvedValue([]);
    mockCustomersService.upsertFromInteraction.mockResolvedValue(null);
    mockPricing.priceLines.mockResolvedValue([PRICED_LINE]);
    mockNumbering.serviceDateFor.mockResolvedValue(SERVICE_DATE);
    mockNumbering.allocate.mockResolvedValue(42);
    mockTaxResolver.getPolicy.mockResolvedValue(NO_TAX_POLICY);
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
    prisma.order.create.mockResolvedValue({
      id: 'order-1',
      status: 'pending',
      total: 2500,
      orderItems: [],
      table: null,
    });
  });

  const posOrder = (overrides: Record<string, unknown> = {}) =>
    ({
      channel: 'pos',
      type: 'dine_in',
      items: [{ menuItemId: 'item-1', quantity: 1 }],
      ...overrides,
    }) as any;

  const publicOrder = (overrides: Record<string, unknown> = {}) =>
    ({
      channel: 'public',
      type: 'dine_in',
      items: [{ menuItemId: 'item-1', quantity: 1 }],
      ...overrides,
    }) as any;

  const created = () => prisma.order.create.mock.calls[0][0].data;

  // ─── Numérotation ─────────────────────────────────────────────────────────

  describe('numérotation du ticket', () => {
    it('attribue un numéro de service, pas un identifiant tronqué', async () => {
      await service.create(posOrder());

      expect(created().number).toBe(42);
      expect(created().serviceDate).toBe(SERVICE_DATE);
    });

    it('réserve le numéro DANS la transaction de création', async () => {
      // Sans cela, un échec de création laisserait un trou dans la séquence.
      await service.create(posOrder());

      expect(mockNumbering.allocate).toHaveBeenCalledWith(prisma, SERVICE_DATE);
    });
  });

  // ─── Ticket vide ──────────────────────────────────────────────────────────

  describe('ouverture d’un ticket vide', () => {
    it('ouvre un ticket sans article — le service à table commence là', async () => {
      await service.create(posOrder({ items: [], sendImmediately: false }));

      expect(mockPricing.priceLines).not.toHaveBeenCalled();
      expect(created().orderItems.create).toEqual([]);
      expect(created().status).toBe('open');
      expect(created().total).toBe(0);
    });

    it('n’envoie rien en cuisine pour un ticket vide', async () => {
      // Même si l'appelant demande l'envoi : il n'y a rien à envoyer.
      await service.create(posOrder({ items: [], sendImmediately: true }));

      expect(
        mockInventoryService.decrementStockForOrder,
      ).not.toHaveBeenCalled();
      expect(mockEventsService.emitToStaff).not.toHaveBeenCalledWith(
        'new-order',
        expect.anything(),
      );
    });

    it('refuse une commande client sans article', async () => {
      await expect(service.create(publicOrder({ items: [] }))).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── Brouillon ou envoi immédiat ──────────────────────────────────────────

  describe('envoi en cuisine à l’ouverture', () => {
    it('envoie par défaut : c’est le comportement d’un comptoir', async () => {
      await service.create(posOrder());

      expect(created().orderItems.create[0].status).toBe('sent');
      expect(created().orderItems.create[0].sentAt).toBeInstanceOf(Date);
      expect(created().status).toBe('pending');
    });

    it('ouvre un ticket en brouillon quand le service à table le demande', async () => {
      await service.create(posOrder({ sendImmediately: false }));

      expect(created().orderItems.create[0].status).toBe('draft');
      expect(created().orderItems.create[0].sentAt).toBeNull();
      expect(created().status).toBe('open');
    });

    it('ignore la demande de brouillon sur le canal public', async () => {
      // Personne n'est là pour décider de l'envoi d'une commande client.
      await service.create(publicOrder({ sendImmediately: false }));

      expect(created().orderItems.create[0].status).toBe('sent');
    });
  });

  // ─── Stock ────────────────────────────────────────────────────────────────

  describe('stock', () => {
    it('décrémente à l’envoi en cuisine', async () => {
      prisma.order.create.mockResolvedValue({
        id: 'order-42',
        status: 'pending',
        total: 2500,
        orderItems: [],
        table: null,
      });

      await service.create(posOrder());

      expect(mockInventoryService.decrementStockForOrder).toHaveBeenCalledWith(
        prisma,
        'order-42',
        [{ menuItemId: 'item-1', quantity: 1 }],
      );
    });

    it('ne consomme rien tant que les lignes restent en brouillon', async () => {
      await service.create(posOrder({ sendImmediately: false }));

      expect(
        mockInventoryService.decrementStockForOrder,
      ).not.toHaveBeenCalled();
    });

    it('annule le ticket quand le stock est insuffisant', async () => {
      mockInventoryService.decrementStockForOrder.mockRejectedValue(
        new Error('Stock insuffisant'),
      );

      await expect(service.create(posOrder())).rejects.toThrow(
        'Stock insuffisant',
      );
    });
  });

  // ─── Temps réel ───────────────────────────────────────────────────────────

  describe('temps réel', () => {
    it('prévient la cuisine quand les lignes partent', async () => {
      await service.create(posOrder());

      expect(mockEventsService.emitToStaff).toHaveBeenCalledWith(
        'new-order',
        expect.any(Object),
      );
    });

    it('prévient la salle, pas la cuisine, pour un ticket en brouillon', async () => {
      await service.create(posOrder({ sendImmediately: false }));

      expect(mockEventsService.emitToStaff).toHaveBeenCalledWith(
        'ticket-opened',
        expect.any(Object),
      );
      expect(mockEventsService.emitToStaff).not.toHaveBeenCalledWith(
        'new-order',
        expect.anything(),
      );
    });

    it('signale chaque ingrédient passé sous son seuil', async () => {
      mockInventoryService.decrementStockForOrder.mockResolvedValue([
        { ingredientId: 'ing-1', name: 'Riz', stock: 2, minStock: 5 },
      ]);

      await service.create(posOrder());

      expect(mockEventsService.emitToStaff).toHaveBeenCalledWith(
        'low-stock-alert',
        expect.objectContaining({ ingredientId: 'ing-1' }),
      );
    });
  });

  // ─── Livraison ────────────────────────────────────────────────────────────

  describe('livraison', () => {
    it('facture le tarif de la zone, pas celui envoyé par l’appelant', async () => {
      prisma.deliveryZone.findFirst.mockResolvedValue({
        id: 'zone-1',
        price: 1000,
        minOrder: null,
      });

      await service.create(
        posOrder({
          type: 'delivery',
          deliveryZoneId: 'zone-1',
          deliveryAddress: 'Rue 1',
          deliveryFee: 1, // tentative de contournement
        }),
      );

      expect(created().deliveryFee).toBe(1000);
      expect(created().total).toBe(3500); // 2500 + 1000
    });

    it('oppose le minimum de commande au client public', async () => {
      prisma.deliveryZone.findFirst.mockResolvedValue({
        id: 'zone-1',
        price: 1000,
        minOrder: 5000, // sous-total 2500 < 5000
      });

      await expect(
        service.create(
          publicOrder({ type: 'delivery', deliveryZoneId: 'zone-1' }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('laisse le comptoir accepter une livraison sous le minimum', async () => {
      prisma.deliveryZone.findFirst.mockResolvedValue({
        id: 'zone-1',
        price: 1000,
        minOrder: 5000,
      });

      await service.create(
        posOrder({ type: 'delivery', deliveryZoneId: 'zone-1' }),
      );

      expect(prisma.order.create).toHaveBeenCalled();
    });

    it('exige une zone pour une livraison publique', async () => {
      await expect(
        service.create(publicOrder({ type: 'delivery' })),
      ).rejects.toThrow(BadRequestException);
    });

    it('n’enregistre aucun frais de livraison sur une commande sur place', async () => {
      await service.create(posOrder({ deliveryFee: 900 }));

      expect(created().deliveryFee).toBeNull();
      expect(created().total).toBe(2500);
    });
  });

  // ─── Table ────────────────────────────────────────────────────────────────

  describe('table', () => {
    it('ne vérifie pas la table quand aucune n’est fournie', async () => {
      await service.create(posOrder());

      expect(prisma.table.findFirst).not.toHaveBeenCalled();
    });

    it('rejette une table inexistante', async () => {
      prisma.table.findFirst.mockResolvedValue(null);

      await expect(
        service.create(posOrder({ tableId: 'table-x' })),
      ).rejects.toThrow(BadRequestException);
    });

    it('ne rattache pas de table à une commande à emporter', async () => {
      await service.create(posOrder({ type: 'takeaway', tableId: 'table-1' }));

      expect(prisma.table.findFirst).not.toHaveBeenCalled();
      expect(created().tableId).toBeNull();
    });
  });

  // ─── Champs libres et fiche client ────────────────────────────────────────

  describe('champs libres et fiche client', () => {
    it('nettoie le HTML des notes et des coordonnées', async () => {
      await service.create(
        posOrder({
          specialNotes: '<script>alert(1)</script>Sans oignon',
          customerName: '<b>Awa</b>',
        }),
      );

      expect(created().specialNotes).toBe('alert(1)Sans oignon');
      expect(mockCustomersService.upsertFromInteraction).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Awa' }),
      );
    });

    it('ne recrée pas de fiche quand le client est déjà identifié', async () => {
      await service.create(
        posOrder({ customerId: 'cust-1', customerName: 'Awa' }),
      );

      expect(mockCustomersService.upsertFromInteraction).not.toHaveBeenCalled();
      expect(created().customerId).toBe('cust-1');
    });
  });
});
