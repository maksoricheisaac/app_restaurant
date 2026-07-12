'use client';

import Link from 'next/link';
import { Sparkles, Infinity as InfinityIcon, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePlanUsage, type UsageEntry } from '@/hooks/api/usePlanUsage';

const LABELS: Record<string, string> = {
  menuItems: 'Articles au menu',
  tables: 'Tables',
  staff: "Membres d'équipe",
  monthlyOrders: 'Commandes / mois',
};

function UsageRow({ label, entry }: { label: string; entry: UsageEntry }) {
  const unlimited = entry.max === null;
  const pct =
    entry.max === null || entry.max === 0
      ? 0
      : Math.min(100, Math.round((entry.current / entry.max) * 100));
  const atLimit = entry.max !== null && entry.current >= entry.max;
  const near = !unlimited && pct >= 80;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground/80">{label}</span>
        <span className={cn('font-semibold tabular-nums', atLimit && 'text-destructive')}>
          {entry.current}
          {unlimited ? (
            <span className="inline-flex items-center text-muted-foreground ml-1">
              / <InfinityIcon className="h-3.5 w-3.5 ml-0.5" />
            </span>
          ) : (
            <span className="text-muted-foreground"> / {entry.max}</span>
          )}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              atLimit ? 'bg-destructive' : near ? 'bg-amber-500' : 'bg-primary',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Récapitulatif « Utilisation du forfait » — affiche le plan courant et la
 * consommation réelle vs les limites (data-driven via /plans/usage). Rend
 * visible ce que le plan autorise directement sur le tableau de bord.
 */
export function PlanUsageCard() {
  const { data, isLoading } = usePlanUsage();

  if (isLoading || !data) return null;

  const entries = Object.entries(data.usage) as [string, UsageEntry][];
  const anyAtLimit = entries.some(([, e]) => e.max !== null && e.current >= e.max);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Utilisation du forfait
          <Badge variant="secondary" className="uppercase text-[10px] font-bold ml-1">
            {data.plan}
          </Badge>
        </CardTitle>
        <Link
          href="/admin/billing"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Gérer <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
          {entries.map(([key, entry]) => (
            <UsageRow key={key} label={LABELS[key] ?? key} entry={entry} />
          ))}
        </div>
        {anyAtLimit && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 px-3 py-2.5 flex items-center justify-between gap-3">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Une limite de votre forfait est atteinte.
            </p>
            <Link
              href="/admin/billing"
              className="shrink-0 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:underline inline-flex items-center gap-1"
            >
              Mettre à niveau <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
