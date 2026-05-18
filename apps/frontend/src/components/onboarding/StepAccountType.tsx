'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Building2, Network, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { onboardingService } from '@/services/onboarding.service';
import type { OnboardingData } from '@/types/onboarding';

interface Props {
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
}

const accountTypes = [
  {
    id: 'OWNER' as const,
    icon: Store,
    title: 'Propriétaire',
    description: 'Je gère un seul restaurant en tant que propriétaire ou gérant.',
    gradient: 'from-orange-500 to-amber-400',
    glow: 'hover:shadow-orange-100',
  },
  {
    id: 'MULTI_MANAGER' as const,
    icon: Building2,
    title: 'Multi-restaurants',
    description: 'Je supervise plusieurs établissements ou une chaîne de restaurants.',
    gradient: 'from-violet-500 to-purple-400',
    glow: 'hover:shadow-violet-100',
  },
  {
    id: 'FRANCHISE' as const,
    icon: Network,
    title: 'Franchise',
    description: 'Je pilote un réseau franchise avec des points de vente multiples.',
    gradient: 'from-sky-500 to-blue-400',
    glow: 'hover:shadow-sky-100',
  },
];

export default function StepAccountType({ onNext, onBack }: Props) {
  const [selected, setSelected] = useState<'OWNER' | 'MULTI_MANAGER' | 'FRANCHISE' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!selected) return;
    setIsLoading(true);
    setError('');
    try {
      await onboardingService.saveAccountType({ accountType: selected });
      onNext({ accountType: selected });
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Quel type de compte ?
        </h1>
        <p className="text-sm text-slate-500">
          Choisissez le profil qui correspond à votre activité.
        </p>
      </div>

      <div className="space-y-3">
        {accountTypes.map((type, i) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;
          return (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setSelected(type.id)}
              className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 shadow-sm hover:shadow-md ${type.glow} ${
                isSelected
                  ? 'border-primary bg-primary/[0.03] shadow-primary/10'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${type.gradient} shadow-sm`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{type.title}</p>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white text-[9px] font-bold"
                      >
                        ✓
                      </motion.span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{type.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

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
          disabled={!selected || isLoading}
          onClick={handleContinue}
          className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Continuer
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
