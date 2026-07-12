'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import StepAccountCreation from '@/components/onboarding/StepAccountCreation';
import StepRestaurantInfo from '@/components/onboarding/StepRestaurantInfo';
import StepPlanSelection from '@/components/onboarding/StepPlanSelection';
import StepPayment from '@/components/onboarding/StepPayment';
import StepFinalization from '@/components/onboarding/StepFinalization';
import { usePlanCatalog } from '@/hooks/api/usePlans';
import type { PlanCatalog } from '@/config/plans';
import type { OnboardingData } from '@/types/onboarding';

export type { OnboardingData };

// Wizard à 4 étapes. AUCUNE donnée n'est écrite en base avant la Finalisation :
// les étapes Compte / Restaurant / Forfait n'accumulent que du state client ;
// la Finalisation envoie tout (compte inclus) au backend en une transaction
// unique. Tant que le wizard n'est pas terminé, aucun compte n'existe en base.
// Le 4e libellé dépend du plan : « Paiement » pour un plan payant (une vraie
// étape de paiement s'intercale), « Finalisation » pour le plan gratuit.
const stepLabels = (isPaid: boolean) => [
  'Compte',
  'Restaurant',
  'Forfait',
  isPaid ? 'Paiement' : 'Finalisation',
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

  // Catalogue des plans (data-driven) — sert à router la sortie de l'étape
  // Forfait (payant → Paiement, gratuit → Finalisation) et à alimenter les
  // écrans Forfait / Paiement. Piloté par le PRIX, jamais par une clé codée.
  const { plans: catalog } = usePlanCatalog();
  const planByKey: Record<string, PlanCatalog> = Object.fromEntries(
    (catalog ?? []).map((p) => [p.key, p]),
  );
  const isPaidPlan = (key?: string) =>
    key ? (planByKey[key]?.monthlyPrice ?? 0) > 0 : false;

  // Reprise du brouillon au montage (données client uniquement) + pré-sélection
  // du plan depuis l'URL (?plan=pro), utilisée par les CTA de la page /pricing.
  useEffect(() => {
    const draft = loadDraft();
    const planParam =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('plan')
        : null;
    // Toute clé de plan est acceptée (data-driven). L'écran Forfait ne la
    // met en évidence que si elle correspond à un plan réellement disponible.
    const preselectedPlan = planParam || undefined;

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
  // l'étape Paiement dès que le plan choisi a un prix (> 0), directement vers la
  // Finalisation pour un plan gratuit. Piloté par le PRIX (et non par des IDs
  // codés en dur) afin que tout nouveau plan payant soit routé correctement.
  const goFromPlan = (stepData: Partial<OnboardingData>) => {
    const isPaid = isPaidPlan(stepData.plan);
    setData((prev) => ({ ...prev, ...stepData }));
    setDir(1);
    setStep(isPaid ? STEP_PAYMENT : STEP_FINALIZE);
  };

  const goBack = () => {
    setDir(-1);
    // Depuis la Finalisation (plan gratuit) ou le Paiement, revenir au Forfait.
    setStep((prev) => (prev >= STEP_PAYMENT ? STEP_PLAN : prev - 1));
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
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
        return (
          <StepPlanSelection
            onNext={goFromPlan}
            onBack={goBack}
            data={data}
            plans={catalog ?? []}
          />
        );
      case STEP_PAYMENT:
        return (
          <StepPayment
            data={data as OnboardingData}
            plan={planByKey[data.plan as string]}
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

  const labels = stepLabels(isPaidPlan(data.plan));
  // L'étape Paiement (payant) et la Finalisation (gratuit) partagent la 4e
  // pastille de progression.
  const progressStep = Math.min(step, STEP_PAYMENT);
  const showProgress = step < STEP_FINALIZE;
  // Les étapes Forfait (3) et Paiement (4) s'affichent en « paysage » : on
  // élargit le conteneur pour que les cartes de plans / le récap + formulaire
  // ne soient pas confinés dans la colonne étroite des étapes de formulaire.
  const wide = step === STEP_PLAN || step === STEP_PAYMENT;

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header — minimal, sans les étapes d'onboarding */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm group-hover:-rotate-3 transition-transform">
            <ChefHat className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <span className="font-display text-lg text-foreground hidden sm:block">Flash Menu</span>
        </Link>

        <Link
          href="/auth/login"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="hidden sm:inline">Déjà inscrit ? </span>
          <span className="font-semibold text-primary">Connexion</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start md:items-center justify-center px-4 py-10 md:py-16">
        <div className={`w-full transition-[max-width] duration-300 ${wide ? 'max-w-5xl' : 'max-w-lg'}`}>
          {/* Indicateur d'étapes dans le body, pas dans le header.
              gap-3 md:gap-8 laisse respirer les libellés (positionnés en absolute
              sous les pastilles, visibles md+) ; mb-10 aère nettement l'ensemble
              par rapport à la carte du formulaire. */}
          {showProgress && (
            <div className="mb-10 flex flex-col items-center gap-3 md:gap-8">
              <OnboardingProgress currentStep={progressStep} steps={labels} />
              <span className="text-xs font-medium text-muted-foreground">
                Étape {progressStep + 1} sur {labels.length}
              </span>
            </div>
          )}

          {/* Card */}
          <div className="rounded-3xl bg-card shadow-xl border border-border overflow-hidden">
            {/* Barre de progression en haut de la card */}
            {showProgress && (
              <div className="h-1 bg-muted">
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
            <p className="mt-4 text-center text-xs text-muted-foreground">
              En continuant, vous acceptez nos{' '}
              <Link href="#" className="text-foreground/70 hover:underline">
                Conditions d&apos;utilisation
              </Link>{' '}
              et notre{' '}
              <Link href="#" className="text-foreground/70 hover:underline">
                Politique de confidentialité
              </Link>
              .
            </p>
          )}
        </div>
      </main>

      {/* Background decoration — halo chaud */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-amber-300/10 blur-3xl" />
      </div>
    </div>
  );
}
