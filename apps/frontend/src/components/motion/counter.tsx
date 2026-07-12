'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { observeOnce, prefersReducedMotion } from './in-view';

type CounterProps = {
  to: number;
  className?: string;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Formatage des milliers façon FR (espace fine). */
  group?: boolean;
};

/**
 * Compteur animé déclenché à l'entrée dans le viewport (IntersectionObserver). Si
 * reduced-motion, affiche directement la valeur finale. Utiliser des chiffres
 * tabulaires côté appelant pour éviter le CLS.
 */
export function Counter({
  to,
  className,
  duration = 2,
  prefix = '',
  suffix = '',
  decimals = 0,
  group = false,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  const format = (v: number) => {
    const n = v.toFixed(decimals);
    const grouped = group ? Number(n).toLocaleString('fr-FR', { minimumFractionDigits: decimals }) : n;
    return `${prefix}${grouped}${suffix}`;
  };

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        el.textContent = format(to);
        return;
      }
      const obj = { v: 0 };
      return observeOnce(el, () => {
        gsap.to(obj, {
          v: to,
          duration,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = format(obj.v);
          },
        });
      });
    },
    { scope: ref, dependencies: [to] },
  );

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}
