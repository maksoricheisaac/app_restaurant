'use client';

import { useRef, type ElementType, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { observeOnce, prefersReducedMotion } from './in-view';

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Décalage vertical de départ (px). */
  y?: number;
  /** Décalage horizontal de départ (px). */
  x?: number;
  delay?: number;
  duration?: number;
};

/**
 * Révélation à l'entrée dans le viewport (fade + translation), déclenchée par
 * IntersectionObserver. Le contenu est rendu normalement côté serveur (bon pour
 * le SEO) et l'animation ne s'ajoute que côté client, hors reduced-motion.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  className,
  y = 26,
  x = 0,
  delay = 0,
  duration = 0.85,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      gsap.set(el, { autoAlpha: 0, y, x });
      return observeOnce(el, () => {
        gsap.to(el, { autoAlpha: 1, y: 0, x: 0, duration, delay, ease: 'power3.out' });
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
