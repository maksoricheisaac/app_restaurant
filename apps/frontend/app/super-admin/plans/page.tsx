'use client';

import {
  Zap, Sparkles, Building2, Check,
  Users, TrendingUp, ArrowUpRight, MoreVertical,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/ui/stats-card';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTenants } from '@/hooks/api/useDashboard';
import { PLANS, MONTHLY_PRICE } from '@/config/plans';
import type { PlanId } from '@/config/plans';

const PLAN_UI: Record<PlanId, {
  icon: typeof Zap;
  iconBg: string;
  iconColor: string;
  accent: string;
  badge: string | null;
}> = {
  free: {
    icon: Zap,
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    accent: 'border-border',
    badge: null,
  },
  pro: {
    icon: Sparkles,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    accent: 'border-primary/40 ring-1 ring-primary/20',
    badge: 'Le plus populaire',
  },
  enterprise: {
    icon: Building2,
    iconBg: 'bg-violet-50 dark:bg-violet-950/30',
    iconColor: 'text-violet-600',
    accent: 'border-violet-200 dark:border-violet-800',
    badge: null,
  },
};

export default function PlansPage() {
  const { data: tenants } = useTenants();

  const countByPlan: Record<PlanId, number> = {
    free:       tenants?.filter((t: any) => !t.plan || t.plan === 'free').length ?? 0,
    pro:        tenants?.filter((t: any) => t.plan === 'pro').length ?? 0,
    enterprise: tenants?.filter((t: any) => t.plan === 'enterprise').length ?? 0,
  };

  const mrrByPlan: Record<PlanId, number> = {
    free:       0,
    pro:        countByPlan.pro        * MONTHLY_PRICE.pro,
    enterprise: countByPlan.enterprise * MONTHLY_PRICE.enterprise,
  };

  const totalMRR       = mrrByPlan.pro + mrrByPlan.enterprise;
  const totalPaid      = countByPlan.pro + countByPlan.enterprise;
  const conversionRate = tenants?.length
    ? Math.round((totalPaid / tenants.length) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Forfaits</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestion des plans d'abonnement et de leur configuration.
          </p>
        </div>
      </div>

      {/* MRR Stats — calculé depuis les tenants réels × prix config */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="MRR Total"
          value={`${totalMRR.toLocaleString('fr-FR')} €`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="green"
          subtitle="Revenu mensuel récurrent"
        />
        <StatsCard
          title="Abonnés payants"
          value={totalPaid}
          icon={<Users className="h-5 w-5" />}
          variant="blue"
          subtitle="Comptes Pro + Enterprise"
        />
        <StatsCard
          title="Taux de conversion"
          value={`${conversionRate} %`}
          icon={<ArrowUpRight className="h-5 w-5" />}
          variant="purple"
          subtitle="Gratuit → Payant"
        />
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan) => {
          const ui    = PLAN_UI[plan.id];
          const Icon  = ui.icon;
          const count = countByPlan[plan.id];
          const mrr   = mrrByPlan[plan.id];

          return (
            <div
              key={plan.id}
              className={cn(
                'relative bg-card rounded-2xl border shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow',
                ui.accent,
              )}
            >
              {plan.comingSoon ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-slate-400 px-3 py-0.5 text-[10px] font-bold text-white shadow-sm uppercase tracking-wide">
                    🚧 En développement
                  </span>
                </div>
              ) : ui.badge ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm uppercase tracking-wide">
                    {ui.badge}
                  </span>
                </div>
              ) : null}

              {/* Plan header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-xl', ui.iconBg)}>
                    <Icon className={cn('h-5 w-5', ui.iconColor)} />
                  </div>
                  <div>
                    <p className="font-bold">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer text-muted-foreground" disabled>
                      Modifier (bientôt)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black">
                  {plan.monthlyPrice === 0 ? 'Gratuit' : `${plan.monthlyPrice} €`}
                </span>
                {plan.monthlyPrice > 0 && (
                  <span className="text-sm text-muted-foreground">/ mois</span>
                )}
              </div>

              {/* Mini stats — données réelles */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted border border-border p-3">
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Restaurants</p>
                </div>
                <div className="rounded-lg bg-muted border border-border p-3">
                  <p className="text-lg font-bold">
                    {mrr === 0 ? '—' : `${mrr.toLocaleString('fr-FR')} €`}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">MRR</p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1.5 pt-1 border-t border-border">
                {plan.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
