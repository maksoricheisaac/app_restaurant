'use client';

import { useRef, type ElementType, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { observeOnce, prefersReducedMotion } from './in-view';

type StaggerProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  y?: number;
  duration?: number;
  stagger?: number;
};

/**
 * Révèle les enfants directs en cascade (stagger) à l'entrée dans le viewport,
 * via IntersectionObserver. À utiliser sur des grilles de cartes / listes.
 * Respecte prefers-reduced-motion.
 */
export function Stagger({
  children,
  as: Tag = 'div',
  className,
  y = 22,
  duration = 0.7,
  stagger = 0.09,
}: StaggerProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const items = gsap.utils.toArray<HTMLElement>(el.children);
      if (!items.length || prefersReducedMotion()) return;
      gsap.set(items, { autoAlpha: 0, y });
      return observeOnce(el, () => {
        gsap.to(items, {
          autoAlpha: 1,
          y: 0,
          duration,
          ease: 'power3.out',
          stagger,
        });
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
