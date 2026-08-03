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

/**
 * Chemin unique de création d'une commande. Ces tests portent sur le métier
 * partagé par le comptoir et le parcours client — c'est ici, et nulle part
 * ailleurs, que sont vérifiés l'intégrité des prix, la validation des
 * options et les frais de livraison.
 */
describe('OrderCreationService', () => {
  let service: OrderCreationService;
  let prisma: MockPrisma;

  const menuItem = {
    id: 'item-1',
    name: 'Poulet braisé',
    price: 2500,
    image: null,
    optionGroups: [],
  };

  const itemWithOptions = {
    id: 'item-2',
    name: 'Burger',
    price: 3000,
    image: null,
    optionGroups: [
      {
        id: 'g1',
        name: 'Cuisson',
        required: true,
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: 'o-saignant', name: 'Saignant', priceDelta: 0 },
          { id: 'o-apoint', name: 'À point', priceDelta: 0 },
        ],
      },
      {
        id: 'g2',
        name: 'Suppléments',
        required: false,
        minSelect: 0,
        maxSelect: 2,
        options: [
          { id: 'o-bacon', name: 'Bacon', priceDelta: 500 },
          { id: 'o-cheese', name: 'Cheddar', priceDelta: 300 },
        ],
      },
    ],
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new OrderCreationService(
      prisma as any,
      mockEventsService as any,
      mockCustomersService as any,
      mockInventoryService as any,
    );
    jest.clearAllMocks();
    mockInventoryService.decrementStockForOrder.mockResolvedValue([]);
    mockCustomersService.upsertFromInteraction.mockResolvedValue(null);
    // create() écrit dans une transaction — router tx vers le même mock que
    // celui utilisé dans les assertions.
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
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

  const orderCreated = (total: number) =>
    prisma.order.create.mockResolvedValue({
      id: 'order-1',
      status: 'pending',
      total,
      orderItems: [],
      table: null,
    });

  // ─── Intégrité des prix ───────────────────────────────────────────────────

  describe('intégrité des prix', () => {
    it.each(['pos', 'public'] as const)(
      'ignore le prix envoyé par le client et relit celui de la base (canal %s)',
      async (channel) => {
        prisma.menuItem.findMany.mockResolvedValue([menuItem]);
        orderCreated(5000);

        await service.create({
          channel,
          type: 'dine_in',
          items: [
            {
              menuItemId: 'item-1',
              quantity: 2,
              name: 'Article falsifié',
              price: 0.01, // l'appelant tente 1 centime
            },
          ],
        } as any);

        const created = prisma.order.create.mock.calls[0][0];
        const line = created.data.orderItems.create[0];
        expect(line.price).toBe(2500);
        expect(line.name).toBe('Poulet braisé');
        expect(created.data.total).toBe(5000); // 2 × 2500, pas 2 × 0,01
      },
    );

    it('rejette un article inconnu ou supprimé', async () => {
      prisma.menuItem.findMany.mockResolvedValue([]);

      await expect(service.create(posOrder())).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.order.create).not.toHaveBeenCalled();
    });
  });

  // ─── Options et suppléments : identiques sur les deux canaux ──────────────

  describe('options et suppléments', () => {
    it.each(['pos', 'public'] as const)(
      'ajoute le priceDelta au prix unitaire et fige le snapshot (canal %s)',
      async (channel) => {
        prisma.menuItem.findMany.mockResolvedValue([itemWithOptions]);
        orderCreated(3500);

        await service.create({
          channel,
          type: 'dine_in',
          items: [
            {
              menuItemId: 'item-2',
              quantity: 1,
              selectedOptionIds: ['o-saignant', 'o-bacon'],
            },
          ],
        } as any);

        const created = prisma.order.create.mock.calls[0][0];
        const line = created.data.orderItems.create[0];
        expect(line.price).toBe(3500); // 3000 + 500 bacon
        expect(created.data.total).toBe(3500);
        expect(line.options).toEqual([
          { groupName: 'Cuisson', optionName: 'Saignant', priceDelta: 0 },
          { groupName: 'Suppléments', optionName: 'Bacon', priceDelta: 500 },
        ]);
      },
    );

    it.each(['pos', 'public'] as const)(
      'rejette un groupe obligatoire sans sélection (canal %s)',
      async (channel) => {
        prisma.menuItem.findMany.mockResolvedValue([itemWithOptions]);

        await expect(
          service.create({
            channel,
            type: 'dine_in',
            items: [
              { menuItemId: 'item-2', quantity: 1, selectedOptionIds: [] },
            ],
          } as any),
        ).rejects.toThrow(BadRequestException);
        expect(prisma.order.create).not.toHaveBeenCalled();
      },
    );

    it('rejette plus d’options que maxSelect dans un groupe', async () => {
      prisma.menuItem.findMany.mockResolvedValue([itemWithOptions]);

      await expect(
        service.create(
          posOrder({
            items: [
              {
                menuItemId: 'item-2',
                quantity: 1,
                selectedOptionIds: ['o-saignant', 'o-apoint'], // 2 dans un max 1
              },
            ],
          }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette une option qui n’appartient pas au plat', async () => {
      prisma.menuItem.findMany.mockResolvedValue([itemWithOptions]);

      await expect(
        service.create(
          posOrder({
            items: [
              {
                menuItemId: 'item-2',
                quantity: 1,
                selectedOptionIds: ['o-saignant', 'o-inconnue'],
              },
            ],
          }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('n’enregistre pas de snapshot quand aucune option n’est choisie', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
      orderCreated(2500);

      await service.create(posOrder());

      const line =
        prisma.order.create.mock.calls[0][0].data.orderItems.create[0];
      expect(line.options).toBeUndefined();
    });
  });

  // ─── Règles propres au canal ──────────────────────────────────────────────

  describe('règles propres au canal', () => {
    it('n’expose au client public que les articles disponibles', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
      orderCreated(2500);

      await service.create(publicOrder());

      const where = prisma.menuItem.findMany.mock.calls[0][0].where;
      expect(where.available).toBe(true);
    });

    it('laisse le comptoir vendre un article retiré de la carte en ligne', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
      orderCreated(2500);

      await service.create(posOrder());

      const where = prisma.menuItem.findMany.mock.calls[0][0].where;
      expect(where.available).toBeUndefined();
      expect(where.deletedAt).toBeNull();
    });

    it('accepte un article hors carte au comptoir', async () => {
      orderCreated(1200);

      await service.create(
        posOrder({
          items: [{ name: 'Café offert maison', price: 1200, quantity: 1 }],
        }),
      );

      const line =
        prisma.order.create.mock.calls[0][0].data.orderItems.create[0];
      expect(line.menuItemId).toBeNull();
      expect(line.name).toBe('Café offert maison');
      expect(line.price).toBe(1200);
    });

    it('refuse un article hors carte sur le canal public', async () => {
      await expect(
        service.create(
          publicOrder({
            items: [{ name: 'Gratuit', price: 0, quantity: 1 }],
          }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuse un article hors carte sans libellé ni prix', async () => {
      await expect(
        service.create(posOrder({ items: [{ quantity: 1 }] })),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Livraison ────────────────────────────────────────────────────────────

  describe('livraison', () => {
    it('facture le tarif de la zone, pas celui envoyé par l’appelant', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
      prisma.deliveryZone.findFirst.mockResolvedValue({
        id: 'zone-1',
        price: 1000,
        minOrder: null,
      });
      orderCreated(3500);

      await service.create(
        posOrder({
          type: 'delivery',
          deliveryZoneId: 'zone-1',
          deliveryAddress: 'Rue 1',
          deliveryFee: 1, // tentative de contournement
        }),
      );

      const created = prisma.order.create.mock.calls[0][0];
      expect(created.data.deliveryFee).toBe(1000);
      expect(created.data.total).toBe(3500); // 2500 + 1000
      expect(created.data.deliveryZoneId).toBe('zone-1');
    });

    it('oppose le minimum de commande au client public', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
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
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it('laisse le comptoir accepter une livraison sous le minimum', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
      prisma.deliveryZone.findFirst.mockResolvedValue({
        id: 'zone-1',
        price: 1000,
        minOrder: 5000,
      });
      orderCreated(3500);

      await service.create(
        posOrder({ type: 'delivery', deliveryZoneId: 'zone-1' }),
      );

      expect(prisma.order.create).toHaveBeenCalled();
    });

    it('exige une zone pour une livraison publique', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);

      await expect(
        service.create(publicOrder({ type: 'delivery' })),
      ).rejects.toThrow(BadRequestException);
    });

    it('n’enregistre aucun frais de livraison sur une commande sur place', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
      orderCreated(2500);

      await service.create(posOrder({ deliveryFee: 900 }));

      const created = prisma.order.create.mock.calls[0][0];
      expect(created.data.deliveryFee).toBeNull();
      expect(created.data.total).toBe(2500);
    });
  });

  // ─── Table ────────────────────────────────────────────────────────────────

  describe('table', () => {
    it('ne vérifie pas la table quand aucune n’est fournie', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
      orderCreated(2500);

      await service.create(posOrder());

      expect(prisma.table.findFirst).not.toHaveBeenCalled();
    });

    it('rejette une table inexistante', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
      prisma.table.findFirst.mockResolvedValue(null);

      await expect(
        service.create(posOrder({ tableId: 'table-x' })),
      ).rejects.toThrow(BadRequestException);
    });

    it('ne rattache pas de table à une commande à emporter', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
      orderCreated(2500);

      await service.create(posOrder({ type: 'takeaway', tableId: 'table-1' }));

      expect(prisma.table.findFirst).not.toHaveBeenCalled();
      expect(prisma.order.create.mock.calls[0][0].data.tableId).toBeNull();
    });
  });

  // ─── Stock et temps réel ──────────────────────────────────────────────────

  describe('stock et temps réel', () => {
    it('décrémente le stock dans la transaction de création', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
      prisma.order.create.mockResolvedValue({
        id: 'order-42',
        status: 'pending',
        total: 5000,
        orderItems: [],
        table: null,
      });

      await service.create(
        posOrder({ items: [{ menuItemId: 'item-1', quantity: 2 }] }),
      );

      expect(mockInventoryService.decrementStockForOrder).toHaveBeenCalledWith(
        prisma,
        'order-42',
        [{ menuItemId: 'item-1', quantity: 2 }],
      );
    });

    it('annule la commande quand le stock est insuffisant', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
      orderCreated(2500);
      mockInventoryService.decrementStockForOrder.mockRejectedValue(
        new Error('Stock insuffisant'),
      );

      await expect(service.create(posOrder())).rejects.toThrow(
        'Stock insuffisant',
      );
    });

    it('émet new-order après la création', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
      orderCreated(2500);

      await service.create(posOrder());

      expect(mockEventsService.emitToStaff).toHaveBeenCalledWith(
        'new-order',
        expect.any(Object),
      );
    });

    it('émet une alerte pour chaque ingrédient passé sous son seuil', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
      orderCreated(2500);
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

  // ─── Champs libres et fiche client ────────────────────────────────────────

  describe('champs libres et fiche client', () => {
    it('nettoie le HTML des notes et des coordonnées', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
      orderCreated(2500);

      await service.create(
        posOrder({
          specialNotes: '<script>alert(1)</script>Sans oignon',
          customerName: '<b>Awa</b>',
        }),
      );

      expect(prisma.order.create.mock.calls[0][0].data.specialNotes).toBe(
        'alert(1)Sans oignon',
      );
      expect(mockCustomersService.upsertFromInteraction).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Awa' }),
      );
    });

    it('ne recrée pas de fiche quand le client est déjà identifié', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);
      orderCreated(2500);

      await service.create(
        posOrder({ customerId: 'cust-1', customerName: 'Awa' }),
      );

      expect(mockCustomersService.upsertFromInteraction).not.toHaveBeenCalled();
      expect(prisma.order.create.mock.calls[0][0].data.customerId).toBe(
        'cust-1',
      );
    });
  });

  it('rejette une commande sans article', async () => {
    await expect(service.create(posOrder({ items: [] }))).rejects.toThrow(
      BadRequestException,
    );
  });
});
