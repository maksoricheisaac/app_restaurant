'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

type MagneticProps = {
  children: ReactNode;
  className?: string;
  /** Intensité de l'attraction (0.2 discret → 0.5 marqué). */
  strength?: number;
  /** display:block (pleine largeur) au lieu d'inline-block. */
  block?: boolean;
};

/**
 * Bouton/élément « magnétique » : suit légèrement le curseur puis revient en
 * douceur. Desktop (pointeur fin) uniquement, et jamais si reduced-motion.
 * `quickTo` garde l'animation fluide sans recréer un tween à chaque pointermove.
 */
export function Magnetic({ children, className, strength = 0.35, block = false }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const el = ref.current;
      if (!el || !contextSafe) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!window.matchMedia('(pointer: fine)').matches) return;

      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });

      const onMove = contextSafe((e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      const onLeave = contextSafe(() => {
        xTo(0);
        yTo(0);
      });

      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
      return () => {
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', onLeave);
      };
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={className} style={{ display: block ? 'block' : 'inline-block', willChange: 'transform' }}>
      {children}
    </span>
  );
}
