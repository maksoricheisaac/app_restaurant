'use client';

import { ReactNode } from 'react';
import { Lock, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFeature } from '@/hooks/api/usePlanUsage';
import { FEATURE_LABELS } from '@/config/plans';

interface FeatureGateProps {
  /** Clé de feature du plan (ex: 'kds', 'advancedReports', 'multiSite'). */
  feature: string;
  children: ReactNode;
  /** Libellé lisible ; par défaut dérivé de FEATURE_LABELS. */
  featureName?: string;
  className?: string;
}

/**
 * Verrouille son contenu si la feature n'est pas incluse dans le plan du tenant
 * (data-driven — via /plans/usage). Remplace l'approche par hiérarchie de plan
 * codée en dur : un Super Admin peut activer une feature sur n'importe quel
 * plan et le gating suit automatiquement.
 */
export function FeatureGate({ feature, children, featureName, className }: FeatureGateProps) {
  const { enabled, isLoading } = useFeature(feature);
  const label = featureName ?? FEATURE_LABELS[feature] ?? 'Cette fonctionnalité';

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-20', className)}>
        <Loader2 className="h-7 w-7 animate-spin text-primary/40" />
      </div>
    );
  }

  if (enabled) return <>{children}</>;

  return (
    <div className={cn('relative min-h-[240px]', className)}>
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold">{label} n&apos;est pas incluse dans votre forfait</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Passez à un forfait qui inclut « {label} » pour débloquer cette fonctionnalité.
            </p>
          </div>
          <Button asChild size="sm" className="gap-2">
            <Link href="/admin/billing">
              <Zap className="h-4 w-4" />
              Voir les forfaits
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
