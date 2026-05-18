'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingService } from '@/services/onboarding.service';
import type { OnboardingData } from '@/types/onboarding';

interface Props {
  data: OnboardingData;
}

const STEPS = [
  { label: 'Création de votre espace restaurant', delay: 0 },
  { label: 'Configuration de votre menu', delay: 900 },
  { label: 'Mise en place de votre tableau de bord', delay: 1800 },
  { label: 'Finalisation de votre compte', delay: 2700 },
];

export default function StepFinalization({ data }: Props) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentLabel, setCurrentLabel] = useState(0);
  const [error, setError] = useState('');
  const [isDone, setIsDone] = useState(false);
  const { setUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        // Start the animation sequence
        STEPS.forEach((step, i) => {
          setTimeout(() => {
            setCurrentLabel(i);
            setTimeout(() => setCompletedSteps((prev) => [...prev, i]), 500);
          }, step.delay);
        });

        // Make the API call
        const result = await onboardingService.complete();

        if (result.success) {
          // Update auth context
          setUser(result.user as any);

          // Store tenant info via httpOnly cookie route (never document.cookie)
          if (result.tenant) {
            await fetch('/api/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tenantId: result.tenant.id,
                tenantSlug: result.tenant.slug,
              }),
            });
          }

          // Wait for animation to finish before redirect
          setTimeout(() => {
            setIsDone(true);
            setTimeout(() => router.push('/admin/dashboard'), 800);
          }, 3600);
        }
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue lors de la finalisation');
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="space-y-4 text-center py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto">
          <span className="text-2xl">⚠️</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Erreur de finalisation</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-primary hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      <div className="text-center space-y-2">
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div
              key="done"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mx-auto"
            >
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="h-9 w-9 text-primary" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isDone ? `Bienvenue sur Flash Menu !` : 'Préparation de votre espace…'}
          </h1>
          {isDone && data.restaurantName && (
            <p className="mt-1 text-sm text-slate-500">
              {data.restaurantName} est prêt. Redirection en cours…
            </p>
          )}
        </motion.div>
      </div>

      <div className="space-y-3 max-w-sm mx-auto">
        {STEPS.map((step, i) => {
          const isComplete = completedSteps.includes(i);
          const isCurrent = currentLabel === i && !isComplete;
          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: isCurrent || isComplete ? 1 : 0.35, x: 0 }}
              transition={{ delay: step.delay / 1000, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="h-7 w-7 shrink-0 flex items-center justify-center">
                {isComplete ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </motion.div>
                ) : isCurrent ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="h-4 w-4 text-primary" />
                  </motion.div>
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-slate-200" />
                )}
              </div>
              <p
                className={`text-sm transition-colors ${
                  isComplete
                    ? 'text-slate-600 line-through decoration-slate-300'
                    : isCurrent
                    ? 'text-slate-900 font-medium'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {data.restaurantName && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-slate-50 border border-slate-100 p-4 max-w-sm mx-auto"
        >
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Votre espace</p>
          <p className="font-semibold text-slate-900">{data.restaurantName}</p>
          {data.slug && (
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{data.slug}.flashmenu.app</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
