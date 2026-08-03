'use client';

import { Plus, Check } from 'lucide-react';
import type { MenuItem } from '../_lib/types';
import { WARM, withAlpha } from '../_lib/theme';
import { ItemImage, PriceTag } from './primitives';

/**
 * Carte produit : photo mise en valeur, prix lisible, badge quantité si présent
 * au panier, bouton d'ajout. Toute la carte est cliquable pour ouvrir le détail
 * (options / description).
 */
export function ItemCard({
  item,
  color,
  onBrand,
  currency,
  inCartQty,
  onOpen,
  onQuickAdd,
}: {
  item: MenuItem;
  color: string;
  onBrand: string;
  currency: string;
  inCartQty: number;
  onOpen: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
}) {
  const hasOptions = (item.optionGroups?.length ?? 0) > 0;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-3xl text-left transition-all duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: WARM.card,
        border: `1px solid ${inCartQty > 0 ? withAlpha(color, 0.35) : WARM.border}`,
        boxShadow:
          inCartQty > 0
            ? `0 6px 20px ${withAlpha(color, 0.14)}`
            : '0 2px 10px -4px rgba(42,38,32,0.10)',
      }}
    >
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="relative block h-44 w-full overflow-hidden text-left"
        style={{ backgroundColor: WARM.surface }}
        aria-label={`Voir ${item.name}`}
      >
        <ItemImage
          src={item.image}
          alt={item.name}
          color={color}
          sizes="(max-width: 640px) 100vw, 320px"
          className="transition-transform duration-700 group-hover:scale-[1.06]"
        />
        {item.image && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        )}
        <span
          className="absolute bottom-3 left-4 rounded-full px-3 py-1 text-sm font-bold shadow-md"
          style={
            item.image
              ? { color: '#fff', backgroundColor: withAlpha(WARM.dark, 0.35), backdropFilter: 'blur(4px)' }
              : { color: onBrand, backgroundColor: color }
          }
        >
          <PriceTag amount={Number(item.price)} currency={currency} />
        </span>
        {inCartQty > 0 && (
          <span
            className="absolute right-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold shadow-lg"
            style={{ backgroundColor: color, color: onBrand }}
          >
            {inCartQty}
          </span>
        )}
      </button>

      <div className="flex flex-1 items-start justify-between gap-3 px-4 py-3.5">
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="text-[15px] font-semibold leading-snug" style={{ color: WARM.ink }}>
            {item.name}
          </h3>
          {item.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed" style={{ color: WARM.muted }}>
              {item.description}
            </p>
          )}
          {hasOptions && (
            <span className="mt-2 inline-block text-[11px] font-semibold" style={{ color }}>
              Personnalisable
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => (hasOptions ? onOpen(item) : onQuickAdd(item))}
          className="flex h-11 w-11 min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 touch-manipulation"
          style={{ backgroundColor: color, color: onBrand }}
          aria-label={hasOptions ? `Personnaliser ${item.name}` : `Ajouter ${item.name}`}
        >
          {inCartQty > 0 && !hasOptions ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
