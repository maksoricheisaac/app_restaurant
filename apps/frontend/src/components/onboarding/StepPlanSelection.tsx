'use client';

import { motion } from 'framer-motion';
import { Check, Zap, ArrowLeft, ArrowRight, Sparkles, Building, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OnboardingData } from '@/types/onboarding';
import { PLANS } from '@/config/plans';
import type { PlanId } from '@/config/plans';

interface Props {
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  data: Partial<OnboardingData>;
}

const PLAN_UI: Record<PlanId, {
  icon: typeof Zap;
  iconBg: string;
  iconColor: string;
  hoverBorder: string;
}> = {
  free: {
    icon: Zap,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    hoverBorder: 'hover:border-slate-400',
  },
  pro: {
    icon: Sparkles,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    hoverBorder: 'hover:border-primary',
  },
  enterprise: {
    icon: Building,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    hoverBorder: 'hover:border-violet-400',
  },
};

export default function StepPlanSelection({ onNext, onBack }: Props) {
  // Choisir un plan = valider directement l'étape : on redirige aussitôt vers
  // la suite (finalisation pour le plan gratuit, page de paiement pour un plan
  // payant). Aucune écriture en base — seul le plan choisi est accumulé.
  const handleSelect = (plan: PlanId) => {
    onNext({ plan });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Choisissez votre forfait
        </h1>
        <p className="text-sm text-slate-500">
          Sélectionnez un plan pour continuer. Changez à tout moment, sans engagement.
        </p>
      </div>

      <div className="space-y-3">
        {PLANS.map((plan, i) => {
          const ui = PLAN_UI[plan.id];
          const Icon = ui.icon;
          const isDisabled = !!plan.comingSoon;
          const isPaid = plan.monthlyPrice > 0;

          return (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => !isDisabled && handleSelect(plan.id)}
              disabled={isDisabled}
              className={`group relative w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                isDisabled
                  ? 'border-dashed border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                  : `border-slate-200 bg-white hover:shadow-md ${ui.hoverBorder}`
              }`}
            >
              {plan.comingSoon ? (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-slate-400 px-3 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    🚧 Bientôt disponible
                  </span>
                </div>
              ) : plan.badge ? (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    {plan.badge}
                  </span>
                </div>
              ) : null}

              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ui.iconBg}`}>
                  <Icon className={`h-5 w-5 ${ui.iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{plan.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900">{plan.priceLabel}</p>
                      <p className="text-[10px] text-slate-400">{plan.priceDetail}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                    {plan.highlights.slice(0, 6).map((h) => (
                      <div key={h} className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 shrink-0 text-green-500" />
                        <span className="text-[11px] text-slate-600">{h}</span>
                      </div>
                    ))}
                  </div>

                  {!isDisabled && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      {isPaid ? (
                        <>
                          <CreditCard className="h-3.5 w-3.5" />
                          Continuer vers le paiement
                        </>
                      ) : (
                        <>
                          Créer mon restaurant
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </div>
                  )}
                </div>

                <ArrowRight className={`mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 ${isDisabled ? 'hidden' : 'group-hover:text-primary'}`} />
              </div>
            </motion.button>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400">
        Le plan gratuit démarre immédiatement. Les plans payants passent par un paiement sécurisé.
      </p>

      <div className="flex">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 px-4 border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    </div>
  );
}
