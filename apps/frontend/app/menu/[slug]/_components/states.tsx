'use client';

import { UtensilsCrossed } from 'lucide-react';
import { WARM } from '../_lib/theme';

/** Bloc centré générique (icône + titre + sous-titre + action). */
export function StatusBlock({
  icon: Icon = UtensilsCrossed,
  title,
  subtitle,
  action,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-5 p-8 text-center"
      style={{ backgroundColor: WARM.page }}
    >
      <div
        className="flex h-20 w-20 items-center justify-center rounded-3xl shadow-sm"
        style={{ backgroundColor: WARM.card, border: `1px solid ${WARM.border}` }}
      >
        <Icon className="h-9 w-9" strokeWidth={1.5} style={{ color: WARM.fainter }} />
      </div>
      <div className="space-y-1">
        <p className="font-display text-2xl" style={{ color: WARM.ink }}>
          {title}
        </p>
        {subtitle && (
          <p className="mx-auto max-w-xs text-sm" style={{ color: WARM.faint }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Petit état vide inline (pour une section de menu, un panier…). */
export function InlineEmpty({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-3 py-16 text-center">
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl"
        style={{ backgroundColor: WARM.card, border: `1px solid ${WARM.border}` }}
      >
        <UtensilsCrossed className="h-9 w-9" strokeWidth={1.5} style={{ color: WARM.fainter }} />
      </div>
      <p className="font-display text-xl" style={{ color: WARM.ink }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-sm" style={{ color: WARM.faint }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
