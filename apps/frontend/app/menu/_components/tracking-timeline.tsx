'use client';

import { useRef } from 'react';
import { CheckCircle2, Clock, ChefHat, BellRing } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/components/motion/in-view';
import { WARM, withAlpha } from '../_lib/theme';

export const TRACK_STEPS = [
  { key: 'pending', label: 'Commande reçue', sub: 'Le restaurant a bien reçu votre commande', icon: Clock },
  { key: 'preparing', label: 'En préparation', sub: 'La cuisine prépare votre commande', icon: ChefHat },
  { key: 'ready', label: 'Prête !', sub: 'Votre commande est prête', icon: BellRing },
  { key: 'served', label: 'Servie', sub: 'Bon appétit !', icon: CheckCircle2 },
] as const;

/**
 * Timeline verticale animée : le trait de progression se remplit jusqu'à l'étape
 * courante (GSAP scaleY) et le nœud actif « pop » à chaque changement de statut.
 * Respecte prefers-reduced-motion.
 */
export function TrackingTimeline({
  currentStep,
  color,
  onBrand,
}: {
  currentStep: number;
  color: string;
  onBrand: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const reduce = prefersReducedMotion();
      const fill = el.querySelector<HTMLElement>('[data-progress-fill]');
      const activeNode = el.querySelector<HTMLElement>('[data-active="true"]');

      if (fill) {
        const target = currentStep / (TRACK_STEPS.length - 1);
        if (reduce) gsap.set(fill, { scaleY: target });
        else gsap.to(fill, { scaleY: target, duration: 0.8, ease: 'power2.out' });
      }
      if (activeNode && !reduce) {
        gsap.fromTo(
          activeNode,
          { scale: 0.6 },
          { scale: 1, duration: 0.5, ease: 'back.out(2)' },
        );
      }
    },
    { scope: ref, dependencies: [currentStep] },
  );

  return (
    <div
      ref={ref}
      className="relative rounded-3xl p-5"
      style={{ backgroundColor: WARM.card, border: `1px solid ${WARM.border}` }}
    >
      {/* Rail + progression (positionnés sur la colonne des nœuds) */}
      <div className="absolute left-[calc(1.25rem+1.125rem)] top-[calc(1.25rem+1.125rem)] bottom-[calc(1.25rem+1.125rem)] w-0.5 -translate-x-1/2" style={{ backgroundColor: WARM.surfaceAlt }}>
        <div
          data-progress-fill
          className="h-full w-full origin-top rounded-full"
          style={{ backgroundColor: color, transform: 'scaleY(0)' }}
        />
      </div>

      <ol className="relative space-y-0">
        {TRACK_STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          const Icon = step.icon;
          const isLast = i === TRACK_STEPS.length - 1;
          return (
            <li key={step.key} className={`flex gap-4 ${isLast ? '' : 'pb-6'}`}>
              <div
                data-active={active}
                className="relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors duration-300"
                style={{
                  backgroundColor: done || active ? color : WARM.surfaceAlt,
                  color: done || active ? onBrand : WARM.faint,
                  boxShadow: active ? `0 0 0 4px ${withAlpha(color, 0.18)}` : 'none',
                }}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="flex-1 pt-1">
                <p
                  className="flex items-center gap-2 text-sm font-bold leading-none"
                  style={{ color: done || active ? WARM.ink : WARM.faint }}
                >
                  {step.label}
                  {active && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: color, color: onBrand }}
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                      Maintenant
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs" style={{ color: active ? WARM.muted : WARM.fainter }}>
                  {step.sub}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
