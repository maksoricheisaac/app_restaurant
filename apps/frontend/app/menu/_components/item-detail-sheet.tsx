'use client';

import { useEffect, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import type { MenuItem, CartLine } from '../_lib/types';
import { WARM, withAlpha } from '../_lib/theme';
import { formatCurrency } from '@/lib/order-utils';
import { BottomSheet } from './bottom-sheet';
import { ItemImage, QuantityStepper } from './primitives';

type Selected = CartLine['selectedOptions'];

/**
 * Feuille de détail d'un plat : photo, description, sélection des options
 * (choix unique = radio, choix multiple = cases), quantité et total en direct.
 * Bloque l'ajout tant que les groupes obligatoires ne sont pas satisfaits.
 */
export function ItemDetailSheet({
  item,
  open,
  onClose,
  color,
  onBrand,
  currency,
  onAdd,
}: {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  color: string;
  onBrand: string;
  currency: string;
  onAdd: (line: Omit<CartLine, 'lineId' | 'quantity'>, quantity: number) => void;
}) {
  const [selection, setSelection] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);

  // Réinitialise l'état à chaque ouverture d'un nouveau plat.
  const itemKey = item?.id ?? '';
  useEffect(() => {
    setSelection({});
    setQuantity(1);
  }, [itemKey]);

  if (!item) return null;
  const groups = item.optionGroups ?? [];

  const toggle = (groupId: string, optionId: string, maxSelect: number) => {
    setSelection((prev) => {
      const current = prev[groupId] ?? [];
      if (maxSelect === 1) return { ...prev, [groupId]: [optionId] };
      if (current.includes(optionId))
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      if (maxSelect > 0 && current.length >= maxSelect) return prev; // limite atteinte
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  const missingRequired = groups.filter((g) => {
    const min = g.required ? Math.max(1, g.minSelect) : g.minSelect;
    return (selection[g.id]?.length ?? 0) < min;
  });
  const canAdd = missingRequired.length === 0;

  const selectedOptions: Selected = groups.flatMap((g) =>
    (selection[g.id] ?? []).map((optId) => {
      const opt = g.options.find((o) => o.id === optId)!;
      return {
        groupId: g.id,
        optionId: optId,
        groupName: g.name,
        optionName: opt.name,
        priceDelta: Number(opt.priceDelta),
      };
    }),
  );

  const unitPrice =
    Number(item.price) + selectedOptions.reduce((s, o) => s + o.priceDelta, 0);
  const total = unitPrice * quantity;

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd(
      {
        itemId: item.id,
        name: item.name,
        image: item.image,
        basePrice: Number(item.price),
        selectedOptions,
      },
      quantity,
    );
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      footer={
        <div className="space-y-2 px-5 pt-4">
          {!canAdd && (
            <p className="text-center text-xs font-medium" style={{ color: WARM.faint }}>
              Choisissez : {missingRequired.map((g) => g.name).join(', ')}
            </p>
          )}
          <div className="flex items-center gap-3">
            <QuantityStepper
              quantity={quantity}
              onChange={(q) => setQuantity(Math.max(1, q))}
              color={color}
              onBrand={onBrand}
              removable={false}
              min={1}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              style={{ backgroundColor: color, color: onBrand, boxShadow: `0 8px 24px ${withAlpha(color, 0.28)}` }}
            >
              <Plus className="h-4 w-4" />
              Ajouter · {formatCurrency(total, currency)}
            </button>
          </div>
        </div>
      }
    >
      {/* Visuel */}
      <div className="relative h-52 w-full" style={{ backgroundColor: WARM.surface }}>
        <ItemImage src={item.image} alt={item.name} color={color} sizes="100vw" />
      </div>

      <div className="space-y-5 px-5 py-5">
        <div>
          <h2 className="font-display text-2xl leading-tight" style={{ color: WARM.ink }}>
            {item.name}
          </h2>
          <p className="mt-1 text-sm font-semibold" style={{ color }}>
            {formatCurrency(Number(item.price), currency)}
          </p>
          {item.description && (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: WARM.muted }}>
              {item.description}
            </p>
          )}
        </div>

        {groups.map((group) => {
          const chosen = selection[group.id] ?? [];
          const multi = group.maxSelect !== 1;
          return (
            <fieldset key={group.id} className="space-y-2">
              <legend className="flex w-full items-center justify-between">
                <span className="text-sm font-bold" style={{ color: WARM.ink }}>
                  {group.name}
                </span>
                <span className="text-xs font-medium" style={{ color: WARM.faint }}>
                  {group.required ? 'Obligatoire' : 'Facultatif'}
                  {group.maxSelect > 1 ? ` · max ${group.maxSelect}` : ''}
                </span>
              </legend>
              <div className="space-y-2">
                {group.options.map((opt) => {
                  const active = chosen.includes(opt.id);
                  const delta = Number(opt.priceDelta);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role={multi ? 'checkbox' : 'radio'}
                      aria-checked={active}
                      onClick={() => toggle(group.id, opt.id, group.maxSelect)}
                      className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors touch-manipulation"
                      style={{
                        borderColor: active ? color : WARM.border,
                        backgroundColor: active ? withAlpha(color, 0.06) : WARM.card,
                      }}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center border-2 ${multi ? 'rounded-md' : 'rounded-full'}`}
                          style={{
                            borderColor: active ? color : WARM.borderStrong,
                            backgroundColor: active ? color : 'transparent',
                          }}
                        >
                          {active && <Check className="h-3 w-3" style={{ color: onBrand }} />}
                        </span>
                        <span className="text-sm" style={{ color: WARM.ink }}>
                          {opt.name}
                        </span>
                      </span>
                      {delta !== 0 && (
                        <span className="text-xs font-semibold tabular-nums" style={{ color: WARM.muted }}>
                          {delta > 0 ? '+' : ''}
                          {formatCurrency(delta, currency)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </BottomSheet>
  );
}
