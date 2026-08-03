import { RevenueService } from './revenue.service';
import { createMockPrisma, MockPrisma } from '../../__tests__/prisma.mock';

/**
 * Source unique du chiffre d'affaires. Ces tests fixent la définition que le
 * tableau de bord et les rapports partagent désormais — c'est leur divergence
 * qui faisait afficher deux montants différents pour la même journée.
 */
describe('RevenueService', () => {
  let service: RevenueService;
  let prisma: MockPrisma;

  const period = {
    start: new Date('2026-06-01T00:00:00.000Z'),
    end: new Date('2026-06-30T23:59:59.999Z'),
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new RevenueService(prisma as any);
    jest.clearAllMocks();
  });

  /** Premier appel = commandé, second = encaissé (ordre du Promise.all). */
  const aggregates = (ordered: any, collected: any) => {
    prisma.order.aggregate = jest
      .fn()
      .mockResolvedValueOnce(ordered)
      .mockResolvedValueOnce(collected);
  };

  it('distingue le commandé de l’encaissé et en déduit le reste dû', async () => {
    aggregates(
      { _sum: { total: 45000 }, _count: { _all: 12 } },
      { _sum: { total: 30000 }, _count: { _all: 8 } },
    );

    const result = await service.compute(period);

    expect(result.ordered).toBe(45000);
    expect(result.collected).toBe(30000);
    expect(result.outstanding).toBe(15000);
    expect(result.orderedCount).toBe(12);
    expect(result.collectedCount).toBe(8);
  });

  it('calcule le panier moyen sur les seules commandes encaissées', async () => {
    aggregates(
      { _sum: { total: 45000 }, _count: { _all: 12 } },
      { _sum: { total: 30000 }, _count: { _all: 8 } },
    );

    const result = await service.compute(period);

    expect(result.averageTicket).toBe(3750); // 30000 / 8
  });

  it('ne divise pas par zéro quand rien n’a été encaissé', async () => {
    aggregates(
      { _sum: { total: 45000 }, _count: { _all: 12 } },
      { _sum: { total: null }, _count: { _all: 0 } },
    );

    const result = await service.compute(period);

    expect(result.collected).toBe(0);
    expect(result.averageTicket).toBe(0);
    expect(result.outstanding).toBe(45000);
  });

  it('exclut les commandes annulées et archivées des deux populations', async () => {
    aggregates(
      { _sum: { total: 0 }, _count: { _all: 0 } },
      { _sum: { total: 0 }, _count: { _all: 0 } },
    );

    await service.compute(period);

    for (const call of (prisma.order.aggregate as jest.Mock).mock.calls) {
      expect(call[0].where.deletedAt).toBeNull();
      expect(call[0].where.status).toEqual({ not: 'cancelled' });
    }
  });

  it('ne compte comme encaissé qu’un paiement abouti', async () => {
    aggregates(
      { _sum: { total: 0 }, _count: { _all: 0 } },
      { _sum: { total: 0 }, _count: { _all: 0 } },
    );

    await service.compute(period);

    const collectedWhere = (prisma.order.aggregate as jest.Mock).mock
      .calls[1][0].where;
    expect(collectedWhere.payment).toEqual({ is: { status: 'completed' } });
  });

  it('date les deux populations sur la commande, pas sur le paiement', async () => {
    aggregates(
      { _sum: { total: 0 }, _count: { _all: 0 } },
      { _sum: { total: 0 }, _count: { _all: 0 } },
    );

    await service.compute(period);

    for (const call of (prisma.order.aggregate as jest.Mock).mock.calls) {
      expect(call[0].where.createdAt).toEqual({
        gte: period.start,
        lte: period.end,
      });
    }
  });
});
