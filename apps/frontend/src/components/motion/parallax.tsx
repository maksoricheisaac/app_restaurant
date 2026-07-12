'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /** Amplitude en px : négatif = monte plus vite que le scroll. */
  amount?: number;
};

/**
 * Parallaxe légère liée au scroll (translateY). Subtile par défaut pour ne jamais
 * désorienter. Désactivée si reduced-motion.
 */
export function Parallax({ children, className, amount = 60 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(el, {
          yPercent: 0,
          y: -amount,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  );
}
