'use client';

import { useRef, type ElementType, type ReactNode } from 'react';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';
import { observeOnce, prefersReducedMotion } from './in-view';

type TextRevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Découpe par lignes (défaut, effet « affiche » masqué) ou par mots. */
  by?: 'lines' | 'words';
  delay?: number;
  stagger?: number;
};

/**
 * Révélation typographique premium : le titre est découpé (SplitText) puis chaque
 * ligne/mot monte derrière un masque, déclenché à l'entrée dans le viewport
 * (IntersectionObserver). On attend `document.fonts.ready` pour que le découpage
 * en lignes soit correct avec la police variable Fraunces, et on masque le titre
 * jusque-là afin d'éviter tout flash.
 */
export function TextReveal({
  children,
  as: Tag = 'h2',
  className,
  by = 'lines',
  delay = 0,
  stagger = 0.12,
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      let split: SplitText | null = null;
      let stop: (() => void) | null = null;
      // Cache le titre tant que le découpage n'a pas eu lieu (anti-flash).
      gsap.set(el, { autoAlpha: 0 });

      const build = () => {
        if (!ref.current) return;
        split = new SplitText(el, {
          type: by,
          mask: by,
          linesClass: 'gsap-line',
          wordsClass: 'gsap-word',
        });
        const targets = by === 'lines' ? split.lines : split.words;
        gsap.set(el, { autoAlpha: 1 });
        gsap.set(targets, { yPercent: 115 });
        stop = observeOnce(el, () => {
          gsap.to(targets, {
            yPercent: 0,
            duration: 1,
            ease: 'power4.out',
            stagger,
            delay,
          });
        });
      };

      const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
      if (fonts && fonts.status !== 'loaded') {
        fonts.ready.then(build).catch(build);
      } else {
        build();
      }

      return () => {
        stop?.();
        split?.revert();
        gsap.set(el, { clearProps: 'visibility,opacity' });
      };
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
