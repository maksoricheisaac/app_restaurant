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
import StepPayment from '@/components/onboarding/StepPayment';
import StepFinalization from '@/components/onboarding/StepFinalization';
import type { OnboardingData } from '@/types/onboarding';

export type { OnboardingData };

// Wizard à 4 étapes. AUCUNE donnée n'est écrite en base avant la Finalisation :
// les étapes Compte / Restaurant / Forfait n'accumulent que du state client ;
// la Finalisation envoie tout (compte inclus) au backend en une transaction
// unique. Tant que le wizard n'est pas terminé, aucun compte n'existe en base.
// Le 4e libellé dépend du plan : « Paiement » pour un plan payant (une vraie
// étape de paiement s'intercale), « Finalisation » pour le plan gratuit.
const stepLabels = (plan?: OnboardingData['plan']) => [
  'Compte',
  'Restaurant',
  'Forfait',
  plan === 'pro' || plan === 'enterprise' ? 'Paiement' : 'Finalisation',
];

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
    // Ne JAMAIS persister le mot de passe en clair dans localStorage. Il ne vit
    // qu'en mémoire (state React) ; après un rechargement, l'utilisateur le
    // ressaisit à l'étape Compte (les autres champs restent pré-remplis).
    const { password: _pwd, ...safe } = data;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(safe));
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

// Indices d'étapes (lisibilité). L'étape Paiement ne concerne que les plans
// payants ; le plan gratuit saute directement du Forfait à la Finalisation.
const STEP_ACCOUNT = 0;
const STEP_RESTAURANT = 1;
const STEP_PLAN = 2;
const STEP_PAYMENT = 3;
const STEP_FINALIZE = 4;

export default function RegisterPage() {
  const [step, setStep] = useState(STEP_ACCOUNT);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const { user, isLoading } = useAuth();
  const router = useRouter();
  // Guard: prevent the redirect from firing more than once per mount.
  const hasRedirected = useRef(false);

  // Reprise du brouillon au montage (données client uniquement) + pré-sélection
  // du plan depuis l'URL (?plan=pro), utilisée par les CTA de la page /pricing.
  useEffect(() => {
    const draft = loadDraft();
    const planParam =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('plan')
        : null;
    const preselectedPlan =
      planParam === 'free' || planParam === 'pro' || planParam === 'enterprise'
        ? (planParam as OnboardingData['plan'])
        : undefined;

    if (Object.keys(draft).length > 0 || preselectedPlan) {
      setData((prev) => ({
        ...draft,
        ...(preselectedPlan ? { plan: preselectedPlan } : {}),
        ...prev,
      }));
    }
  }, []);

  // Persiste le brouillon à chaque changement (hors étape de finalisation).
  useEffect(() => {
    if (step !== STEP_FINALIZE) saveDraft(data);
  }, [data, step]);

  // Si un utilisateur DÉJÀ inscrit atterrit sur /register, on le renvoie vers
  // son tableau de bord. (Il n'existe plus de session « à mi-parcours » : aucun
  // compte n'est créé tant que le wizard n'est pas terminé.)
  useEffect(() => {
    if (isLoading || !user) return;
    // StepFinalization gère sa propre redirection après l'animation.
    if (step === STEP_FINALIZE) return;
    if (user.onboardingCompleted && !hasRedirected.current) {
      hasRedirected.current = true;
      clearDraft();
      router.replace('/admin/dashboard');
    }
  }, [user, isLoading, step, router]);

  const goNext = (stepData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...stepData }));
    setDir(1);
    setStep((prev) => prev + 1);
  };

  // Sortie de l'étape Forfait : cliquer un plan redirige automatiquement — vers
  // l'étape Paiement pour un plan payant, directement vers la Finalisation pour
  // le plan gratuit.
  const goFromPlan = (stepData: Partial<OnboardingData>) => {
    const chosen = stepData.plan;
    setData((prev) => ({ ...prev, ...stepData }));
    setDir(1);
    setStep(chosen === 'pro' || chosen === 'enterprise' ? STEP_PAYMENT : STEP_FINALIZE);
  };

  const goBack = () => {
    setDir(-1);
    // Depuis la Finalisation (plan gratuit) ou le Paiement, revenir au Forfait.
    setStep((prev) => (prev >= STEP_PAYMENT ? STEP_PLAN : prev - 1));
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
        return <StepAccountCreation onNext={goNext} data={data} />;
      case STEP_RESTAURANT:
        return <StepRestaurantInfo onNext={goNext} onBack={goBack} data={data} />;
      case STEP_PLAN:
        return <StepPlanSelection onNext={goFromPlan} onBack={goBack} data={data} />;
      case STEP_PAYMENT:
        return (
          <StepPayment
            data={data as OnboardingData}
            onBack={goBack}
            onComplete={clearDraft}
          />
        );
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

  const labels = stepLabels(data.plan);
  // L'étape Paiement (payant) et la Finalisation (gratuit) partagent la 4e
  // pastille de progression.
  const progressStep = Math.min(step, STEP_PAYMENT);
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
          {/* Indicateur d'étapes dans le body, pas dans le header.
              gap-3 md:gap-8 laisse respirer les libellés (positionnés en absolute
              sous les pastilles, visibles md+) ; mb-10 aère nettement l'ensemble
              par rapport à la carte du formulaire. */}
          {showProgress && (
            <div className="mb-10 flex flex-col items-center gap-3 md:gap-8">
              <OnboardingProgress currentStep={progressStep} steps={labels} />
              <span className="text-xs font-medium text-slate-400">
                Étape {progressStep + 1} sur {labels.length}
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
                  animate={{ width: `${((progressStep + 1) / labels.length) * 100}%` }}
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
