'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import StepAccountCreation from '@/components/onboarding/StepAccountCreation';
import StepAccountType from '@/components/onboarding/StepAccountType';
import StepRestaurantInfo from '@/components/onboarding/StepRestaurantInfo';
import StepPlanSelection from '@/components/onboarding/StepPlanSelection';
import StepFinalization from '@/components/onboarding/StepFinalization';
import type { OnboardingData } from '@/types/onboarding';

export type { OnboardingData };

const STEP_LABELS = ['Compte', 'Profil', 'Restaurant', 'Forfait', 'Finalisation'];

const variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir < 0 ? 48 : -48,
    opacity: 0,
  }),
};

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const { user, isLoading } = useAuth();
  const router = useRouter();
  // Guard: prevent the redirect from firing more than once per mount.
  // Without this, a stale auth state can create an infinite loop between
  // /auth/register and /admin/dashboard when the server-side profile (DB)
  // and the client-side auth state disagree briefly after login.
  const hasRedirected = useRef(false);

  // Redirect or resume if already authenticated
  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    // StepFinalization (step 4) gère sa propre redirection après l'animation.
    if (step === 4) return;
    if (user.onboardingCompleted) {
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        router.replace('/admin/dashboard');
      }
      return;
    }
    // Resume from the saved step
    const savedStep = user.onboardingStep ?? 0;
    if (savedStep > 0 && step === 0) {
      setStep(Math.min(savedStep, 4));
    }
  }, [user, isLoading, step]); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = (stepData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...stepData }));
    setDir(1);
    // Multi-Manager / Franchise : pas de restaurant à créer, sauter au step de finalisation
    if (step === 1 && stepData.accountType && stepData.accountType !== 'OWNER') {
      setStep(4);
      return;
    }
    setStep((prev) => prev + 1);
  };

  const goBack = () => {
    setDir(-1);
    setStep((prev) => prev - 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepAccountCreation onNext={goNext} />;
      case 1:
        return <StepAccountType onNext={goNext} onBack={goBack} />;
      case 2:
        return <StepRestaurantInfo onNext={goNext} onBack={goBack} data={data} />;
      case 3:
        return <StepPlanSelection onNext={goNext} onBack={goBack} data={data} />;
      case 4:
        return <StepFinalization data={data as OnboardingData} />;
      default:
        return null;
    }
  };

  const showProgress = step < 4;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header — minimal, sans les étapes d'onboarding */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:shadow-primary/30 transition-shadow">
            <Store className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 hidden sm:block">Flash Menu</span>
        </Link>

        <Link
          href="/auth/login"
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <span className="hidden sm:inline">Déjà inscrit ? </span>
          <span className="font-semibold text-primary">Connexion</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start md:items-center justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-lg">
          {/* Indicateur d'étapes dans le body, pas dans le header */}
          {showProgress && (
            <div className="mb-5 flex flex-col items-center gap-3">
              <OnboardingProgress currentStep={step} steps={STEP_LABELS} />
              <span className="text-xs font-medium text-slate-400">
                Étape {step + 1} sur {STEP_LABELS.length}
              </span>
            </div>
          )}

          {/* Card */}
          <div className="rounded-2xl bg-white shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
            {/* Barre de progression en haut de la card */}
            {showProgress && (
              <div className="h-1 bg-slate-100">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            )}

            <div className="p-6 sm:p-8">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer note */}
          {step === 0 && (
            <p className="mt-4 text-center text-xs text-slate-400">
              En continuant, vous acceptez nos{' '}
              <Link href="#" className="text-slate-600 hover:underline">
                Conditions d'utilisation
              </Link>{' '}
              et notre{' '}
              <Link href="#" className="text-slate-600 hover:underline">
                Politique de confidentialité
              </Link>
              .
            </p>
          )}
        </div>
      </main>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl" />
      </div>
    </div>
  );
}
