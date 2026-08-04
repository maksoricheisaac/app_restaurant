import { BadRequestException } from '@nestjs/common';
import { OrderLinePricingService } from './order-line-pricing.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

/**
 * Tarification des lignes : prix relus en base, options revalidées.
 *
 * Partagée par l'ouverture d'un ticket et l'ajout d'une tournée — une
 * deuxième implémentation aurait divergé, comme l'avaient fait le comptoir et
 * le parcours client avant leur unification.
 */
describe('OrderLinePricingService', () => {
  let service: OrderLinePricingService;
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
    service = new OrderLinePricingService(prisma as any);
    jest.clearAllMocks();
  });

  // ─── Intégrité des prix ───────────────────────────────────────────────────

  describe('intégrité des prix', () => {
    it.each(['pos', 'public'] as const)(
      'ignore le prix envoyé par l’appelant et relit celui de la base (canal %s)',
      async (channel) => {
        prisma.menuItem.findMany.mockResolvedValue([menuItem]);

        const [line] = await service.priceLines(
          [
            {
              menuItemId: 'item-1',
              quantity: 2,
              name: 'Article falsifié',
              price: 0.01, // l'appelant tente 1 centime
            },
          ],
          channel,
        );

        expect(line.price).toBe(2500);
        expect(line.name).toBe('Poulet braisé');
      },
    );

    it('rejette un article inconnu ou supprimé', async () => {
      prisma.menuItem.findMany.mockResolvedValue([]);

      await expect(
        service.priceLines([{ menuItemId: 'item-1', quantity: 1 }], 'pos'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette une liste vide', async () => {
      await expect(service.priceLines([], 'pos')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── Options et suppléments : identiques sur les deux canaux ──────────────

  describe('options et suppléments', () => {
    it.each(['pos', 'public'] as const)(
      'ajoute le priceDelta au prix unitaire et fige le snapshot (canal %s)',
      async (channel) => {
        prisma.menuItem.findMany.mockResolvedValue([itemWithOptions]);

        const [line] = await service.priceLines(
          [
            {
              menuItemId: 'item-2',
              quantity: 1,
              selectedOptionIds: ['o-saignant', 'o-bacon'],
            },
          ],
          channel,
        );

        expect(line.price).toBe(3500); // 3000 + 500 bacon
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
          service.priceLines(
            [{ menuItemId: 'item-2', quantity: 1, selectedOptionIds: [] }],
            channel,
          ),
        ).rejects.toThrow(BadRequestException);
      },
    );

    it('rejette plus d’options que maxSelect dans un groupe', async () => {
      prisma.menuItem.findMany.mockResolvedValue([itemWithOptions]);

      await expect(
        service.priceLines(
          [
            {
              menuItemId: 'item-2',
              quantity: 1,
              selectedOptionIds: ['o-saignant', 'o-apoint'], // 2 dans un max 1
            },
          ],
          'pos',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette une option qui n’appartient pas au plat', async () => {
      prisma.menuItem.findMany.mockResolvedValue([itemWithOptions]);

      await expect(
        service.priceLines(
          [
            {
              menuItemId: 'item-2',
              quantity: 1,
              selectedOptionIds: ['o-saignant', 'o-inconnue'],
            },
          ],
          'pos',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('n’attache pas de snapshot quand aucune option n’est choisie', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);

      const [line] = await service.priceLines(
        [{ menuItemId: 'item-1', quantity: 1 }],
        'pos',
      );

      expect(line.options).toBeUndefined();
    });
  });

  // ─── Règles propres au canal ──────────────────────────────────────────────

  describe('règles propres au canal', () => {
    it('n’expose au client public que les articles disponibles', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);

      await service.priceLines(
        [{ menuItemId: 'item-1', quantity: 1 }],
        'public',
      );

      expect(prisma.menuItem.findMany.mock.calls[0][0].where.available).toBe(
        true,
      );
    });

    it('laisse le comptoir vendre un article retiré de la carte en ligne', async () => {
      prisma.menuItem.findMany.mockResolvedValue([menuItem]);

      await service.priceLines([{ menuItemId: 'item-1', quantity: 1 }], 'pos');

      const where = prisma.menuItem.findMany.mock.calls[0][0].where;
      expect(where.available).toBeUndefined();
      expect(where.deletedAt).toBeNull();
    });

    it('accepte un article hors carte au comptoir', async () => {
      const [line] = await service.priceLines(
        [{ name: 'Café offert maison', price: 1200, quantity: 1 }],
        'pos',
      );

      expect(line.menuItemId).toBeNull();
      expect(line.name).toBe('Café offert maison');
      expect(line.price).toBe(1200);
    });

    it('refuse un article hors carte sur le canal public', async () => {
      await expect(
        service.priceLines(
          [{ name: 'Gratuit', price: 0, quantity: 1 }],
          'public',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuse un article hors carte sans libellé ni prix', async () => {
      await expect(
        service.priceLines([{ quantity: 1 }], 'pos'),
      ).rejects.toThrow(BadRequestException);
    });

    it('nettoie le HTML du libellé d’un article hors carte', async () => {
      const [line] = await service.priceLines(
        [{ name: '<b>Menu du jour</b>', price: 5000, quantity: 1 }],
        'pos',
      );

      expect(line.name).toBe('Menu du jour');
    });
  });
});
