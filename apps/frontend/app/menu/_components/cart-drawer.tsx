'use client';

import { ArrowRight } from 'lucide-react';
import type { CartLine } from '../_lib/types';
import { WARM, withAlpha } from '../_lib/theme';
import { formatCurrency } from '@/lib/order-utils';
import { lineUnitPrice } from '../_lib/useMenuCart';
import { BottomSheet } from './bottom-sheet';
import { ItemImage, QuantityStepper } from './primitives';
import { InlineEmpty } from './states';

/**
 * Tiroir « Ma sélection » : lignes du panier avec options, édition des
 * quantités, sous-total, puis passage au checkout.
 */
export function CartDrawer({
  open,
  onClose,
  lines,
  subtotal,
  currency,
  color,
  onBrand,
  onSetQuantity,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  subtotal: number;
  currency: string;
  color: string;
  onBrand: string;
  onSetQuantity: (lineId: string, q: number) => void;
  onCheckout: () => void;
}) {
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={
        <span className="flex flex-col">
          Ma sélection
          <span className="text-xs font-normal" style={{ color: WARM.faint }}>
            {itemCount} article{itemCount > 1 ? 's' : ''}
          </span>
        </span>
      }
      footer={
        lines.length > 0 ? (
          <div className="space-y-3 px-5 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: WARM.muted }}>
                Sous-total
              </span>
              <span className="text-2xl font-bold" style={{ color: WARM.ink }}>
                {formatCurrency(subtotal, currency)}
              </span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold shadow-xl transition-transform hover:scale-[1.01] active:scale-[0.99]"
              style={{ backgroundColor: color, color: onBrand, boxShadow: `0 8px 24px ${withAlpha(color, 0.28)}` }}
            >
              Passer commande
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : undefined
      }
    >
      {lines.length === 0 ? (
        <InlineEmpty title="Votre sélection est vide" subtitle="Ajoutez des plats pour commencer." />
      ) : (
        <ul className="divide-y px-5" style={{ borderColor: WARM.border }}>
          {lines.map((line) => (
            <li key={line.lineId} className="flex items-start gap-3 py-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: WARM.surface }}>
                <ItemImage src={line.image} alt={line.name} color={color} sizes="64px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight" style={{ color: WARM.ink }}>
                  {line.name}
                </p>
                {line.selectedOptions.length > 0 && (
                  <p className="mt-0.5 text-xs leading-snug" style={{ color: WARM.faint }}>
                    {line.selectedOptions.map((o) => o.optionName).join(' · ')}
                  </p>
                )}
                <p className="mt-1 text-sm font-bold" style={{ color }}>
                  {formatCurrency(lineUnitPrice(line) * line.quantity, currency)}
                </p>
              </div>
              <div className="flex-shrink-0">
                <QuantityStepper
                  quantity={line.quantity}
                  onChange={(q) => onSetQuantity(line.lineId, q)}
                  color={color}
                  onBrand={onBrand}
                  size="sm"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}
