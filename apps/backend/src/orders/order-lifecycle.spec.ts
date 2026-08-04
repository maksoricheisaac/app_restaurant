import { OrderLineStatus, OrderStatus } from '@prisma/client';
import {
  canTransitionLine,
  computeOrderTotals,
  deriveOrderStatus,
  isLineActive,
  isLineSent,
  isOrderLocked,
} from './order-lifecycle';

const line = (status: OrderLineStatus) => ({ status });

/**
 * Règles pures du cycle de vie d'un ticket. Elles portent l'invariant central
 * du service à table : le statut d'un ticket n'est jamais posé à la main, il
 * se déduit de ses lignes.
 */
describe('deriveOrderStatus', () => {
  it('renvoie « open » tant qu’une ligne est en brouillon', () => {
    expect(
      deriveOrderStatus([line('served'), line('sent'), line('draft')]),
    ).toBe(OrderStatus.open);
  });

  it('renvoie « open » pour un ticket encore vide', () => {
    expect(deriveOrderStatus([])).toBe(OrderStatus.open);
  });

  it('renvoie « pending » quand tout est parti sans être pris en charge', () => {
    expect(deriveOrderStatus([line('sent'), line('sent')])).toBe(
      OrderStatus.pending,
    );
  });

  it('renvoie « preparing » dès qu’une ligne est prise en charge', () => {
    expect(deriveOrderStatus([line('sent'), line('preparing')])).toBe(
      OrderStatus.preparing,
    );
  });

  it('renvoie « preparing » quand une ligne est prête mais une autre non', () => {
    expect(deriveOrderStatus([line('sent'), line('ready')])).toBe(
      OrderStatus.preparing,
    );
  });

  it('renvoie « ready » quand tout est prêt ou déjà servi', () => {
    expect(deriveOrderStatus([line('ready'), line('served')])).toBe(
      OrderStatus.ready,
    );
  });

  it('renvoie « served » quand tout est servi', () => {
    expect(deriveOrderStatus([line('served'), line('served')])).toBe(
      OrderStatus.served,
    );
  });

  it('ignore les lignes annulées dans le calcul', () => {
    expect(deriveOrderStatus([line('served'), line('cancelled')])).toBe(
      OrderStatus.served,
    );
  });

  it('renvoie « cancelled » quand toutes les lignes sont annulées', () => {
    expect(deriveOrderStatus([line('cancelled'), line('cancelled')])).toBe(
      OrderStatus.cancelled,
    );
  });

  it('l’encaissement l’emporte sur l’avancement des lignes', () => {
    expect(deriveOrderStatus([line('sent')], new Date())).toBe(
      OrderStatus.paid,
    );
  });
});

describe('computeOrderTotals', () => {
  /** Ligne déjà ventilée, telle qu'elle est stockée. */
  const taxed = (
    status: OrderLineStatus,
    excl: number,
    tax: number,
    rate = 20,
  ) => ({
    status,
    taxRate: rate,
    lineExclTax: excl,
    lineTax: tax,
    lineInclTax: excl + tax,
  });

  const NO_DELIVERY = { fee: 0, taxRate: 0, pricesIncludeTax: true };

  it('additionne les lignes actives', () => {
    const totals = computeOrderTotals(
      [taxed('sent', 100, 20), taxed('served', 50, 10)],
      NO_DELIVERY,
    );

    expect(totals.subtotalExclTax).toBe(150);
    expect(totals.taxTotal).toBe(30);
    expect(totals.totalInclTax).toBe(180);
  });

  it('ne facture jamais une ligne annulée', () => {
    const totals = computeOrderTotals(
      [taxed('sent', 100, 20), taxed('cancelled', 900, 180)],
      NO_DELIVERY,
    );

    expect(totals.totalInclTax).toBe(120);
  });

  it('ventile les frais de livraison au taux figé sur le ticket', () => {
    const totals = computeOrderTotals([taxed('sent', 100, 20)], {
      fee: 12, // TTC à 20 % → 10 HT + 2 de taxe
      taxRate: 20,
      pricesIncludeTax: true,
    });

    expect(totals.subtotalExclTax).toBe(110);
    expect(totals.taxTotal).toBe(22);
    expect(totals.totalInclTax).toBe(132);
  });

  it('traite des frais de livraison absents comme nuls', () => {
    const totals = computeOrderTotals([taxed('sent', 100, 20)], {
      fee: null,
      taxRate: 20,
      pricesIncludeTax: true,
    });

    expect(totals.totalInclTax).toBe(120);
  });

  it('rend des totaux nuls pour un ticket vide', () => {
    expect(computeOrderTotals([], NO_DELIVERY)).toEqual({
      subtotalExclTax: 0,
      taxTotal: 0,
      totalInclTax: 0,
    });
  });
});

describe('transitions de ligne', () => {
  it('un brouillon ne peut que partir en cuisine', () => {
    expect(canTransitionLine('draft', 'sent')).toBe(true);
    expect(canTransitionLine('draft', 'ready')).toBe(false);
    // Un brouillon se supprime, il ne s'annule pas : rien n'a été consommé.
    expect(canTransitionLine('draft', 'cancelled')).toBe(false);
  });

  it('une ligne partie peut avancer ou être annulée', () => {
    expect(canTransitionLine('sent', 'preparing')).toBe(true);
    expect(canTransitionLine('sent', 'cancelled')).toBe(true);
    expect(canTransitionLine('preparing', 'ready')).toBe(true);
    expect(canTransitionLine('ready', 'served')).toBe(true);
  });

  it('une ligne servie ne peut plus qu’être annulée — geste commercial', () => {
    expect(canTransitionLine('served', 'cancelled')).toBe(true);
    expect(canTransitionLine('served', 'ready')).toBe(false);
  });

  it('une ligne annulée est terminale', () => {
    expect(canTransitionLine('cancelled', 'sent')).toBe(false);
    expect(canTransitionLine('cancelled', 'served')).toBe(false);
  });

  it('ne revient jamais en arrière', () => {
    expect(canTransitionLine('ready', 'preparing')).toBe(false);
    expect(canTransitionLine('preparing', 'sent')).toBe(false);
    expect(canTransitionLine('sent', 'draft')).toBe(false);
  });
});

describe('classification des lignes', () => {
  it('une ligne partie en cuisine a consommé du stock', () => {
    expect(isLineSent('sent')).toBe(true);
    expect(isLineSent('preparing')).toBe(true);
    expect(isLineSent('served')).toBe(true);
    expect(isLineSent('draft')).toBe(false);
    expect(isLineSent('cancelled')).toBe(false);
  });

  it('seule une ligne annulée sort du total', () => {
    expect(isLineActive('draft')).toBe(true);
    expect(isLineActive('served')).toBe(true);
    expect(isLineActive('cancelled')).toBe(false);
  });
});

describe('isOrderLocked', () => {
  it('verrouille dès que le ticket est clos', () => {
    expect(
      isOrderLocked({ closedAt: new Date(), status: OrderStatus.served }),
    ).toBe(true);
  });

  it('verrouille un ticket marqué payé même sans horodatage', () => {
    expect(isOrderLocked({ closedAt: null, status: OrderStatus.paid })).toBe(
      true,
    );
  });

  it('laisse ouvert un ticket en cours de service', () => {
    expect(isOrderLocked({ closedAt: null, status: OrderStatus.ready })).toBe(
      false,
    );
  });
});
