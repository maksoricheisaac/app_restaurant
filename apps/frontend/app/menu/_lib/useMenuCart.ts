'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CartLine } from './types';

const CART_KEY = 'flashmenu_cart';

/** Prix unitaire d'une ligne = plat + suppléments d'options. */
export function lineUnitPrice(line: Pick<CartLine, 'basePrice' | 'selectedOptions'>): number {
  return (
    line.basePrice +
    line.selectedOptions.reduce((s, o) => s + o.priceDelta, 0)
  );
}

/** Identité d'une ligne : plat + combinaison d'options (triée, déterministe). */
export function computeLineId(
  itemId: string,
  optionIds: string[],
): string {
  return [itemId, ...[...optionIds].sort()].join('|');
}

/**
 * Panier client persisté dans localStorage : survit à la navigation vers le
 * checkout et au rechargement. Une ligne = un plat + une combinaison
 * d'options ; ré-ajouter la même combinaison incrémente la quantité.
 */
export function useMenuCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydratation au montage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Persistance à chaque changement (après hydratation, pour ne pas écraser)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(lines));
    } catch {
      /* quota — no-op */
    }
  }, [lines, hydrated]);

  const addLine = useCallback(
    (line: Omit<CartLine, 'lineId' | 'quantity'>, quantity = 1) => {
      const lineId = computeLineId(
        line.itemId,
        line.selectedOptions.map((o) => o.optionId),
      );
      setLines((prev) => {
        const existing = prev.find((l) => l.lineId === lineId);
        if (existing) {
          return prev.map((l) =>
            l.lineId === lineId
              ? { ...l, quantity: l.quantity + quantity }
              : l,
          );
        }
        return [...prev, { ...line, lineId, quantity }];
      });
    },
    [],
  );

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.lineId !== lineId)
        : prev.map((l) => (l.lineId === lineId ? { ...l, quantity } : l)),
    );
  }, []);

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const { itemCount, subtotal } = useMemo(() => {
    return lines.reduce(
      (acc, l) => {
        acc.itemCount += l.quantity;
        acc.subtotal += lineUnitPrice(l) * l.quantity;
        return acc;
      },
      { itemCount: 0, subtotal: 0 },
    );
  }, [lines]);

  return {
    lines,
    hydrated,
    itemCount,
    subtotal,
    addLine,
    setQuantity,
    removeLine,
    clear,
  };
}
