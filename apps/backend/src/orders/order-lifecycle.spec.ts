import { OrderLineStatus, OrderStatus } from '@prisma/client';
import {
  canTransitionLine,
  computeOrderTotal,
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

describe('computeOrderTotal', () => {
  it('additionne les lignes actives et les frais de livraison', () => {
    const total = computeOrderTotal(
      [
        { status: 'sent', price: 2500, quantity: 2 },
        { status: 'served', price: 1000, quantity: 1 },
      ],
      500,
    );
    expect(total).toBe(6500);
  });

  it('ne facture jamais une ligne annulée', () => {
    const total = computeOrderTotal(
      [
        { status: 'sent', price: 2500, quantity: 1 },
        { status: 'cancelled', price: 9000, quantity: 3 },
      ],
      0,
    );
    expect(total).toBe(2500);
  });

  it('traite des frais de livraison absents comme nuls', () => {
    expect(
      computeOrderTotal([{ status: 'sent', price: 1000, quantity: 1 }], null),
    ).toBe(1000);
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
