'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, ArrowRight, ArrowLeft, Loader2, Sparkles, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { onboardingService } from '@/services/onboarding.service';
import type { OnboardingData } from '@/types/onboarding';

interface Props {
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  data: Partial<OnboardingData>;
}

const plans = [
  {
    id: 'free' as const,
    name: 'Starter',
    price: 'Gratuit',
    priceDetail: 'Pour toujours',
    icon: Zap,
    badge: null,
    description: 'Parfait pour démarrer et tester la plateforme.',
    color: 'slate',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    borderSelected: 'border-slate-400',
    features: [
      '1 restaurant',
      'Menu digital QR',
      'Commandes en ligne',
      'Jusqu\'à 50 commandes/mois',
      'Support par email',
    ],
    excluded: ['Analyses avancées', 'Multi-restaurants', 'Intégrations'],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '49€',
    priceDetail: 'par mois',
    icon: Sparkles,
    badge: 'Le plus populaire',
    description: 'Tout ce qu\'il faut pour un restaurant performant.',
    color: 'primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    borderSelected: 'border-primary',
    features: [
      '1 restaurant',
      'Commandes illimitées',
      'Caisse enregistreuse',
      'Inventaire & recettes',
      'Analyses & rapports',
      'Support prioritaire',
    ],
    excluded: [],
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    price: '149€',
    priceDetail: 'par mois',
    icon: Building,
    badge: null,
    description: 'Pour les groupes et franchises multi-établissements.',
    color: 'violet',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    borderSelected: 'border-violet-400',
    features: [
      'Restaurants illimités',
      'Tableau de bord groupe',
      'Gestion centralisée',
      'API & intégrations',
      'Compte manager dédié',
      'SLA garanti',
    ],
    excluded: [],
  },
];

export default function StepPlanSelection({ onNext, onBack, data }: Props) {
  const [selected, setSelected] = useState<'free' | 'pro' | 'enterprise'>('pro');
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
        {plans.map((plan, i) => {
          const Icon = plan.icon;
          const isSelected = selected === plan.id;
          return (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => setSelected(plan.id)}
              className={`relative w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                isSelected
                  ? `${plan.borderSelected} bg-white shadow-md`
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${plan.iconBg}`}>
                  <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{plan.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900">{plan.price}</p>
                      <p className="text-[10px] text-slate-400">{plan.priceDetail}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 shrink-0 text-green-500" />
                        <span className="text-[11px] text-slate-600">{f}</span>
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
