'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, ArrowRight, ArrowLeft, Loader2, Sparkles, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { onboardingService } from '@/services/onboarding.service';
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
  borderSelected: string;
}> = {
  free: {
    icon: Zap,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    borderSelected: 'border-slate-400',
  },
  pro: {
    icon: Sparkles,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    borderSelected: 'border-primary',
  },
  enterprise: {
    icon: Building,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    borderSelected: 'border-violet-400',
  },
};

export default function StepPlanSelection({ onNext, onBack, data }: Props) {
  const [selected, setSelected] = useState<PlanId>('pro');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    setIsLoading(true);
    setError('');
    try {
      await onboardingService.savePlan({ plan: selected });
      onNext({ plan: selected });
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Choisissez votre forfait
        </h1>
        <p className="text-sm text-slate-500">
          Changez de plan à tout moment. Sans engagement.
        </p>
      </div>

      <div className="space-y-3">
        {PLANS.map((plan, i) => {
          const ui = PLAN_UI[plan.id];
          const Icon = ui.icon;
          const isSelected = selected === plan.id;
          const isDisabled = !!plan.comingSoon;

          return (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => !isDisabled && setSelected(plan.id)}
              disabled={isDisabled}
              className={`relative w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                isDisabled
                  ? 'border-dashed border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? `${ui.borderSelected} bg-white shadow-md`
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
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
                </div>

                <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected ? 'border-primary bg-primary' : 'border-slate-300'
                }`}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="h-1.5 w-1.5 rounded-full bg-white"
                    />
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400">
        Les plans payants seront activés après configuration de votre moyen de paiement.
      </p>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 px-4 border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          disabled={isLoading}
          onClick={handleContinue}
          className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Créer mon restaurant
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
