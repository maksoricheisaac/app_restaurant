'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { formatCurrency } from '@/lib/order-utils';
import { withAlpha } from '../_lib/theme';

// ── PriceTag ──────────────────────────────────────────────────────────────────
export function PriceTag({
  amount,
  currency,
  className = '',
}: {
  amount: number;
  currency: string;
  className?: string;
}) {
  return (
    <span className={`tabular-nums ${className}`}>
      {formatCurrency(amount, currency)}
    </span>
  );
}

// ── ItemImage : photo produit avec fallback chaleureux ────────────────────────
export function ItemImage({
  src,
  alt,
  color,
  sizes,
  className = '',
  rounded = '',
}: {
  src: string | null;
  alt: string;
  color: string;
  sizes: string;
  className?: string;
  rounded?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={`object-cover ${className}`}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${rounded}`}
      style={{ background: `linear-gradient(135deg, ${withAlpha(color, 0.14)}, ${withAlpha(color, 0.04)})` }}
      aria-hidden="true"
    >
      <UtensilsCrossed
        className="h-1/3 w-1/3 opacity-25"
        style={{ color }}
        strokeWidth={1.25}
      />
    </div>
  );
}

// ── QuantityStepper : contrôle −/+ accessible, cibles 44px ────────────────────
export function QuantityStepper({
  quantity,
  onChange,
  color,
  onBrand,
  size = 'md',
  min = 0,
  removable = true,
  ariaLabel = 'Quantité',
}: {
  quantity: number;
  onChange: (q: number) => void;
  color: string;
  onBrand: string;
  size?: 'sm' | 'md';
  min?: number;
  removable?: boolean;
  ariaLabel?: string;
}) {
  const btn =
    size === 'sm'
      ? 'h-9 w-9 min-h-[36px] min-w-[36px]'
      : 'h-11 w-11 min-h-[44px] min-w-[44px]';
  const showTrash = removable && quantity === 1;

  return (
    <div className="flex items-center gap-1" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        disabled={!removable && quantity <= min}
        className={`${btn} flex items-center justify-center rounded-full border-2 transition-colors hover:bg-black/[0.04] active:scale-95 touch-manipulation disabled:opacity-40`}
        style={{ borderColor: color }}
        aria-label={showTrash ? 'Retirer' : 'Diminuer la quantité'}
      >
        {showTrash ? (
          <Trash2 className="h-4 w-4" style={{ color }} />
        ) : (
          <Minus className="h-4 w-4" style={{ color }} />
        )}
      </button>
      <span
        className="w-7 text-center text-sm font-bold tabular-nums"
        aria-live="polite"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        className={`${btn} flex items-center justify-center rounded-full shadow-sm transition-transform hover:scale-105 active:scale-95 touch-manipulation`}
        style={{ backgroundColor: color, color: onBrand }}
        aria-label="Augmenter la quantité"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Chip : pastille de filtre / statut ────────────────────────────────────────
export function Chip({
  active,
  color,
  onBrand,
  children,
  onClick,
  ariaCurrent,
}: {
  active?: boolean;
  color: string;
  onBrand: string;
  children: React.ReactNode;
  onClick?: () => void;
  ariaCurrent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={ariaCurrent ? 'true' : undefined}
      className="flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 touch-manipulation"
      style={
        active
          ? { backgroundColor: color, color: onBrand, boxShadow: `0 2px 12px ${withAlpha(color, 0.35)}` }
          : { backgroundColor: '#efeae0', color: '#6b6357' }
      }
    >
      {children}
    </button>
  );
}
