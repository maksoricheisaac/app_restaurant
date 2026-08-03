'use client';

import { useRef } from 'react';
import { ShoppingBag, ChevronUp } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { formatCurrency } from '@/lib/order-utils';
import { withAlpha } from '../_lib/theme';
import { prefersReducedMotion } from '@/components/motion/in-view';

/**
 * Barre panier flottante (safe-area). Apparaît en glissant depuis le bas dès
 * qu'un article est présent — animation GSAP subtile, coupée en reduced-motion.
 */
export function CartBar({
  itemCount,
  subtotal,
  currency,
  color,
  onBrand,
  onOpen,
}: {
  itemCount: number;
  subtotal: number;
  currency: string;
  color: string;
  onBrand: string;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      gsap.fromTo(
        el,
        { y: 90, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' },
      );
    },
    { scope: ref },
  );

  if (itemCount === 0) return null;

  return (
    <div
      ref={ref}
      className="pb-safe-4 fixed inset-x-0 bottom-0 z-40 px-4 pt-4"
    >
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={onOpen}
          className="flex w-full items-center justify-between rounded-2xl px-5 py-4 font-bold shadow-2xl transition-transform hover:scale-[1.01] active:scale-[0.99]"
          style={{ backgroundColor: color, color: onBrand, boxShadow: `0 10px 34px ${withAlpha(color, 0.33)}` }}
        >
          <span className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <ShoppingBag className="h-4 w-4" />
              <span
                className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold"
                style={{ backgroundColor: onBrand, color }}
              >
                {itemCount}
              </span>
            </span>
            <span className="text-sm">Voir ma sélection</span>
          </span>
          <span className="flex items-center gap-2 text-sm">
            {formatCurrency(subtotal, currency)}
            <ChevronUp className="h-4 w-4 opacity-80" />
          </span>
        </button>
      </div>
    </div>
  );
}
