'use client';

import { motion } from 'framer-motion';
import {
  Check, Zap, ArrowLeft, ArrowRight, Sparkles, Building2, Loader2, CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OnboardingData } from '@/types/onboarding';
import { currencySymbol, type PlanCatalog } from '@/config/plans';

interface Props {
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  data: Partial<OnboardingData>;
  plans: PlanCatalog[];
}

// Icône dérivée de la nature du plan (jamais d'une clé figée) afin que tout
// nouveau plan créé côté Super Admin s'affiche correctement.
function planIcon(plan: PlanCatalog) {
  if (plan.key === 'enterprise') return Building2;
  if (plan.monthlyPrice > 0) return Sparkles;
  return Zap;
}

export default function StepPlanSelection({ onNext, onBack, data, plans }: Props) {
  // Choisir un plan = valider directement l'étape : on redirige aussitôt vers
  // la suite (finalisation pour le plan gratuit, paiement pour un plan payant).
  const handleSelect = (plan: PlanCatalog) => {
    if (plan.comingSoon) return;
    onNext({ plan: plan.key });
  };

  const selected = data.plan;

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight text-foreground">
          Choisissez votre forfait
        </h1>
        <p className="text-sm text-muted-foreground">
          Comparez les offres et sélectionnez celle qui vous convient. Un plan
          gratuit démarre tout de suite ; un plan payant ouvre un paiement sécurisé.
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary/50" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {plans.map((plan, i) => {
            const Icon = planIcon(plan);
            const isPaid = plan.monthlyPrice > 0;
            const isPopular = !!plan.badge && !plan.comingSoon;
            const isSelected = selected === plan.key;
            const disabled = plan.comingSoon;

            return (
              <motion.button
                key={plan.key}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => handleSelect(plan)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={`group relative flex flex-col text-left rounded-2xl border-2 p-4 transition-all duration-200 ${
                  disabled
                    ? 'border-dashed border-border bg-muted/30 opacity-70 cursor-not-allowed'
                    : isSelected
                    ? 'border-primary bg-primary/[0.04] shadow-lg ring-1 ring-primary/30'
                    : isPopular
                    ? 'border-primary/50 bg-card hover:border-primary hover:shadow-lg'
                    : 'border-border bg-card hover:border-primary/50 hover:shadow-lg'
                }`}
              >
                {plan.comingSoon ? (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border whitespace-nowrap">
                    Bientôt disponible
                  </span>
                ) : plan.badge ? (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm whitespace-nowrap">
                    <Sparkles className="h-2.5 w-2.5" /> {plan.badge}
                  </span>
                ) : null}

                {/* En-tête : icône + nom + prix */}
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isPaid ? 'bg-primary/10' : 'bg-muted'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${isPaid ? 'text-primary' : 'text-muted-foreground'}`}
                      strokeWidth={1.75}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{plan.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{plan.tagline}</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-3">
                  <span className="font-display text-2xl text-foreground tabular-nums">
                    {isPaid ? `${plan.monthlyPrice}${currencySymbol(plan.currency)}` : 'Gratuit'}
                  </span>
                  {isPaid && <span className="text-[11px] text-muted-foreground">/ mois</span>}
                </div>

                {/* Points clés */}
                <ul className="space-y-1.5 flex-1 mb-3">
                  {plan.highlights.slice(0, 5).map((h) => (
                    <li key={h} className="flex items-start gap-1.5">
                      <Check className="h-3 w-3 mt-0.5 shrink-0 text-success" />
                      <span className="text-[11px] text-foreground/75 leading-snug">{h}</span>
                    </li>
                  ))}
                </ul>

                {!disabled && (
                  <div
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : isPaid
                        ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                        : 'bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    }`}
                  >
                    {isPaid ? (
                      <>
                        <CreditCard className="h-3.5 w-3.5" />
                        Choisir et payer
                      </>
                    ) : (
                      <>Créer mon restaurant</>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Le plan gratuit démarre immédiatement. Les plans payants passent par un
        paiement sécurisé. Changez à tout moment, sans engagement.
      </p>

      <div className="flex">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 px-4 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    </div>
  );
}
