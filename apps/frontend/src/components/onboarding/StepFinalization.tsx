'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingService } from '@/services/onboarding.service';
import type { OnboardingData } from '@/types/onboarding';

interface Props {
  data: OnboardingData;
  /** Appelé une fois l'inscription réussie (ex: purge du brouillon localStorage). */
  onComplete?: () => void;
}

const STEPS = [
  { label: 'Création de votre compte', delay: 0 },
  { label: 'Création de votre espace restaurant', delay: 900 },
  { label: 'Configuration de votre menu', delay: 1800 },
  { label: 'Mise en place de votre tableau de bord', delay: 2700 },
];

/**
 * Finalisation du plan GRATUIT — les plans payants passent par `StepPayment`.
 * C'est ici (plan gratuit) que l'inscription complète (compte + restaurant) est
 * réellement créée, en une transaction unique via `register`.
 */
export default function StepFinalization({ data, onComplete }: Props) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentLabel, setCurrentLabel] = useState(0);
  const [error, setError] = useState('');
  const [isDone, setIsDone] = useState(false);
  const { setUser } = useAuth();
  const router = useRouter();
  // Garde-fou : l'inscription ne doit partir qu'UNE fois, même si React
  // (strict mode en dev, ou un remount) ré-exécute l'effet. Sans cela, deux
  // appels concurrents à /onboarding/register se courent après → 409.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      try {
        // Séquence d'animation (purement cosmétique).
        STEPS.forEach((step, i) => {
          setTimeout(() => {
            setCurrentLabel(i);
            setTimeout(() => setCompletedSteps((prev) => [...prev, i]), 500);
          }, step.delay);
        });

        // Inscription complète (compte + restaurant) en UNE transaction backend
        // — premier et seul moment où quoi que ce soit est écrit.
        const result = await onboardingService.register({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          restaurantName: data.restaurantName,
          slug: data.slug,
          country: data.country,
          currency: data.currency,
          timezone: data.timezone,
          cuisineType: data.cuisineType,
        });

        if (!result.success) return;

        // Session immédiatement cohérente (role=owner + tenantId frais).
        setUser(result.user as any);

        if (result.tenant && typeof window !== 'undefined') {
          localStorage.setItem('tenantId', result.tenant.id);
          localStorage.setItem('tenantSlug', result.tenant.slug);
          await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenantId: result.tenant.id,
              tenantSlug: result.tenant.slug,
            }),
          });
        }

        // Inscription réussie → purge du brouillon.
        onComplete?.();

        // Fin de l'animation puis redirection dashboard.
        setTimeout(() => {
          setIsDone(true);
          setTimeout(() => {
            // router.refresh() force le re-render du layout serveur /admin
            // avec le profil/tenant à jour AVANT la navigation.
            router.refresh();
            router.push('/admin/dashboard');
          }, 800);
        }, 3600);
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue lors de l'inscription");
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="space-y-4 text-center py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/12 mx-auto">
          <AlertTriangle className="h-8 w-8 text-destructive" strokeWidth={1.6} />
        </div>
        <div>
          <h2 className="font-display text-2xl text-foreground">Erreur lors de l&apos;inscription</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-primary font-medium hover:underline"
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
              className="flex h-20 w-20 items-center justify-center rounded-full bg-success/12 mx-auto"
            >
              <CheckCircle2 className="h-10 w-10 text-success" />
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
          <h1 className="font-display text-2xl sm:text-3xl tracking-tight text-foreground">
            {isDone ? 'Bienvenue sur Flash Menu !' : 'Préparation de votre espace…'}
          </h1>
          {isDone && data.restaurantName && (
            <p className="mt-1 text-sm text-muted-foreground">
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
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </motion.div>
                ) : isCurrent ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="h-4 w-4 text-primary" />
                  </motion.div>
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-border" />
                )}
              </div>
              <p
                className={`text-sm transition-colors ${
                  isComplete
                    ? 'text-muted-foreground line-through decoration-border'
                    : isCurrent
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground/60'
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
          className="rounded-2xl bg-muted/40 border border-border p-4 max-w-sm mx-auto"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Votre espace</p>
          <p className="font-semibold text-foreground">{data.restaurantName}</p>
          {data.slug && (
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{data.slug}.flashmenu.app</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
