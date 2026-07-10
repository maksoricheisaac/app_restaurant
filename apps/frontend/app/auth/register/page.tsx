'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import StepAccountCreation from '@/components/onboarding/StepAccountCreation';
import StepRestaurantInfo from '@/components/onboarding/StepRestaurantInfo';
import StepPlanSelection from '@/components/onboarding/StepPlanSelection';
import StepFinalization from '@/components/onboarding/StepFinalization';
import type { OnboardingData } from '@/types/onboarding';

export type { OnboardingData };

// Wizard à 4 étapes. La création de compte (étape 0) ouvre la session ; les
// étapes Restaurant/Forfait n'accumulent que du state client ; la Finalisation
// envoie tout au backend en une transaction unique.
const STEP_LABELS = ['Compte', 'Restaurant', 'Forfait', 'Finalisation'];

// Brouillon (draft) — permet de reprendre l'onboarding après un rechargement
// ou une fermeture d'onglet SANS jamais persister de données définitives en base.
const DRAFT_KEY = 'flashmenu_onboarding_draft';

function loadDraft(): Partial<OnboardingData> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<OnboardingData>) : {};
  } catch {
    return {};
  }
}

function saveDraft(data: Partial<OnboardingData>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    /* quota / mode privé — non bloquant */
  }
}

function clearDraft() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* non bloquant */
  }
}

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

// Indices d'étapes (lisibilité)
const STEP_ACCOUNT = 0;
const STEP_RESTAURANT = 1;
const STEP_PLAN = 2;
const STEP_FINALIZE = 3;

export default function RegisterPage() {
  const [step, setStep] = useState(STEP_ACCOUNT);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const { user, isLoading } = useAuth();
  const router = useRouter();
  // Guard: prevent the redirect from firing more than once per mount.
  const hasRedirected = useRef(false);

  // Reprise du brouillon au montage (données client uniquement).
  useEffect(() => {
    const draft = loadDraft();
    if (Object.keys(draft).length > 0) {
      setData((prev) => ({ ...draft, ...prev }));
    }
  }, []);

  // Persiste le brouillon à chaque changement (hors étape de finalisation).
  useEffect(() => {
    if (step !== STEP_FINALIZE) saveDraft(data);
  }, [data, step]);

  // Redirection / reprise si déjà authentifié
  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    // StepFinalization gère sa propre redirection après l'animation.
    if (step === STEP_FINALIZE) return;
    if (user.onboardingCompleted) {
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        clearDraft();
        router.replace('/admin/dashboard');
      }
      return;
    }
    // Compte déjà créé (session ouverte) mais onboarding non terminé :
    // reprendre directement à l'étape Restaurant.
    if (step === STEP_ACCOUNT) {
      setDir(1);
      setStep(STEP_RESTAURANT);
    }
  }, [user, isLoading, step, router]);

  const goNext = (stepData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...stepData }));
    setDir(1);
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
      case STEP_ACCOUNT:
        return <StepAccountCreation onNext={goNext} />;
      case STEP_RESTAURANT:
        return <StepRestaurantInfo onNext={goNext} onBack={goBack} data={data} />;
      case STEP_PLAN:
        return <StepPlanSelection onNext={goNext} onBack={goBack} data={data} />;
      case STEP_FINALIZE:
        return (
          <StepFinalization
            data={data as OnboardingData}
            onComplete={clearDraft}
          />
        );
      default:
        return null;
    }
  };

  const showProgress = step < STEP_FINALIZE;

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
          {step === STEP_ACCOUNT && (
            <p className="mt-4 text-center text-xs text-slate-400">
              En continuant, vous acceptez nos{' '}
              <Link href="#" className="text-slate-600 hover:underline">
                Conditions d&apos;utilisation
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
