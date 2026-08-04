import { OrderLineStatus, OrderStatus } from '@prisma/client';
import {
  roundMoney,
  splitTax,
  sumTaxedAmounts,
  type TaxTotals,
} from './order-tax';

/**
 * Transitions autorisées pour une ligne de ticket.
 *
 * Une ligne en brouillon ne s'annule pas : elle se supprime, puisqu'elle n'a
 * rien consommé et que personne ne l'a vue. À partir de `sent`, la ligne a
 * mobilisé du stock et du travail en cuisine — elle reste sur le ticket,
 * barrée et motivée.
 */
export const VALID_LINE_TRANSITIONS: Record<
  OrderLineStatus,
  OrderLineStatus[]
> = {
  draft: [OrderLineStatus.sent],
  sent: [
    OrderLineStatus.preparing,
    OrderLineStatus.ready,
    OrderLineStatus.served,
    OrderLineStatus.cancelled,
  ],
  preparing: [
    OrderLineStatus.ready,
    OrderLineStatus.served,
    OrderLineStatus.cancelled,
  ],
  ready: [OrderLineStatus.served, OrderLineStatus.cancelled],
  // Un plat rendu après avoir été servi : geste commercial, toujours motivé.
  served: [OrderLineStatus.cancelled],
  cancelled: [],
};

export function canTransitionLine(
  from: OrderLineStatus,
  to: OrderLineStatus,
): boolean {
  return (VALID_LINE_TRANSITIONS[from] ?? []).includes(to);
}

/** Une ligne partie en cuisine a consommé du stock et engagé la préparation. */
export function isLineSent(status: OrderLineStatus): boolean {
  return (
    status !== OrderLineStatus.draft && status !== OrderLineStatus.cancelled
  );
}

/** Ce qui compte dans le total et dans l'avancement du ticket. */
export function isLineActive(status: OrderLineStatus): boolean {
  return status !== OrderLineStatus.cancelled;
}

/**
 * Avancement du ticket, déduit de ses lignes.
 *
 * C'est la seule façon dont `Order.status` est déterminé — aucun appelant ne
 * le pose à la main. Sans cette règle, un ticket pouvait rester marqué
 * « prêt » alors qu'une nouvelle tournée venait d'être saisie.
 */
export function deriveOrderStatus(
  lines: { status: OrderLineStatus }[],
  closedAt?: Date | null,
): OrderStatus {
  // L'encaissement l'emporte sur tout : le ticket est clos.
  if (closedAt) return OrderStatus.paid;

  const active = lines.filter((l) => isLineActive(l.status));

  // Ticket entièrement annulé — à distinguer d'un ticket encore vide.
  if (lines.length > 0 && active.length === 0) return OrderStatus.cancelled;
  if (active.length === 0) return OrderStatus.open;

  // Une seule ligne encore en brouillon suffit : le ticket est en saisie.
  if (active.some((l) => l.status === OrderLineStatus.draft)) {
    return OrderStatus.open;
  }

  if (active.every((l) => l.status === OrderLineStatus.served)) {
    return OrderStatus.served;
  }
  if (
    active.every(
      (l) =>
        l.status === OrderLineStatus.ready ||
        l.status === OrderLineStatus.served,
    )
  ) {
    return OrderStatus.ready;
  }
  if (active.some((l) => l.status !== OrderLineStatus.sent)) {
    return OrderStatus.preparing;
  }
  return OrderStatus.pending;
}

/**
 * Totaux ventilés du ticket.
 *
 * Une ligne annulée n'est jamais facturée, même si elle reste visible sur le
 * ticket. Les frais de livraison sont ventilés au taux figé à l'ouverture,
 * dans le régime de prix figé lui aussi — un établissement qui bascule de TTC
 * à HT en plein service ne doit pas produire un ticket à deux régimes.
 */
export function computeOrderTotals(
  lines: {
    status: OrderLineStatus;
    taxRate: unknown;
    lineExclTax: unknown;
    lineTax: unknown;
    lineInclTax: unknown;
  }[],
  delivery: {
    fee: unknown;
    taxRate: unknown;
    pricesIncludeTax: boolean;
  },
): TaxTotals {
  const active = lines.filter((l) => isLineActive(l.status));
  const linesTotal = sumTaxedAmounts(active);

  const fee = Number(delivery.fee ?? 0);
  if (fee === 0) return linesTotal;

  const deliveryTax = splitTax(
    fee,
    Number(delivery.taxRate ?? 0),
    delivery.pricesIncludeTax,
  );

  return {
    subtotalExclTax: roundMoney(
      linesTotal.subtotalExclTax + deliveryTax.exclTax,
    ),
    taxTotal: roundMoney(linesTotal.taxTotal + deliveryTax.tax),
    totalInclTax: roundMoney(linesTotal.totalInclTax + deliveryTax.inclTax),
  };
}

/** Un ticket clos est verrouillé : plus aucune ligne ne bouge. */
export function isOrderLocked(order: {
  closedAt: Date | null;
  status: OrderStatus;
}): boolean {
  return order.closedAt !== null || order.status === OrderStatus.paid;
}
