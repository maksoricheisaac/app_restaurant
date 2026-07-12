'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check, X, Zap, Crown, ArrowRight, Shield, RefreshCcw,
  HeartHandshake, ChevronDown, CreditCard, Sparkles, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  FEATURE_LABELS, formatLimit, currencySymbol,
  type PlanCatalog,
} from '@/config/plans';
import { usePlanCatalog } from '@/hooks/api/usePlans';
import { SectionHeading } from '@/components/customs/public/saas/section-heading';
import { Reveal } from '@/components/motion/reveal';
import { Stagger } from '@/components/motion/stagger';
import { TextReveal } from '@/components/motion/text-reveal';
import { Magnetic } from '@/components/motion/magnetic';

type BillingCycle = 'monthly' | 'annual';

// Icône / CTA / lien dérivés de la nature du plan (pas d'une clé figée), afin
// que tout nouveau plan créé dans le Super Admin s'affiche correctement.
function planIcon(plan: PlanCatalog): typeof Zap | null {
  if (plan.key === 'enterprise') return Crown;
  if (plan.monthlyPrice > 0) return Zap;
  return null;
}
function planHref(plan: PlanCatalog): string {
  if (plan.comingSoon) return '/contact?subject=' + plan.key;
  return plan.monthlyPrice > 0
    ? `/auth/register?plan=${plan.key}`
    : '/auth/register';
}
function planCta(plan: PlanCatalog): string {
  if (plan.comingSoon) return "Contacter l'équipe vente";
  return plan.monthlyPrice > 0 ? 'Choisir ce plan' : 'Commencer gratuitement';
}

/** Lignes du comparatif générées à partir des limites + features du catalogue. */
function buildComparisonRows(plans: PlanCatalog[]) {
  const limitRows: { label: string; get: (p: PlanCatalog) => string | boolean }[] = [
    { label: 'Commandes / mois', get: (p) => formatLimit(p.limits.maxMonthlyOrders) },
    { label: 'Articles au menu', get: (p) => formatLimit(p.limits.maxMenuItems) },
    { label: 'Tables + QR codes', get: (p) => formatLimit(p.limits.maxTables) },
    { label: 'Comptes staff', get: (p) => formatLimit(p.limits.maxStaffMembers) },
  ];
  // Toutes les features rencontrées dans le catalogue (connues d'abord).
  const featureKeys = Array.from(
    new Set(plans.flatMap((p) => Object.keys(p.features ?? {}))),
  );
  const featureRows = featureKeys.map((fk) => ({
    label: FEATURE_LABELS[fk] ?? fk,
    get: (p: PlanCatalog) => p.features?.[fk] === true,
  }));
  return [...limitRows, ...featureRows];
}

const FAQS = [
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui. Vous pouvez upgrader instantanément depuis votre tableau de bord. En cas de downgrade, le changement prend effet à la fin de la période en cours.',
  },
  {
    q: "Comment fonctionne l'essai gratuit 14 jours ?",
    a: "Vous accédez à toutes les fonctionnalités du plan Pro pendant 14 jours, sans carte de crédit requise. À la fin de l'essai, vous choisissez un plan ou passez au Gratuit.",
  },
  {
    q: 'Proposez-vous une remise annuelle ?',
    a: 'Oui, en choisissant la facturation annuelle vous économisez environ 20 % par rapport à la facturation mensuelle. Le montant est débité en une seule fois.',
  },
  {
    q: 'Les données sont-elles sécurisées ?',
    a: 'Absolument. Vos données sont hébergées en Europe (cloud certifié ISO 27001), chiffrées en transit (TLS 1.3) et au repos (AES-256), conformes au RGPD.',
  },
  {
    q: 'Que se passe-t-il si je dépasse mes limites sur le plan Gratuit ?',
    a: 'Nous vous envoyons une notification et les nouvelles commandes seront temporairement mises en file d\'attente. Vous pouvez upgrader à tout moment pour lever les restrictions.',
  },
  {
    q: 'Le plan Enterprise est-il personnalisable ?',
    a: 'Oui. Nous construisons une offre sur mesure adaptée à votre volume, vos établissements et vos besoins spécifiques. Contactez notre équipe commerciale.',
  },
];

const TRUST = [
  { icon: Shield,        text: 'Paiement 100 % sécurisé' },
  { icon: RefreshCcw,    text: 'Annulation sans engagement' },
  { icon: HeartHandshake, text: 'Migration gratuite' },
  { icon: CreditCard,    text: "Sans carte pour l'essai" },
];

function CellValue({ value }: { value: string | boolean }) {
  if (value === true)  return <Check className="h-5 w-5 text-success mx-auto" />;
  if (value === false) return <X     className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm font-medium text-foreground">{value}</span>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-accent/40 transition-colors"
      >
        <span className="text-sm font-semibold text-foreground">{q}</span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300', open && 'rotate-180')} />
      </button>
      <div className={cn('grid transition-all duration-300', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function PricingPageClient() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const { plans: catalog, isLoading } = usePlanCatalog();

  const PLANS = catalog ?? [];

  const getPrice = (plan: PlanCatalog) =>
    billing === 'annual' ? plan.annualPrice : plan.monthlyPrice;

  const savings = (plan: PlanCatalog) => {
    if (plan.monthlyPrice <= 0) return null;
    const saved = (plan.monthlyPrice - plan.annualPrice) * 12;
    return saved > 0 ? saved : null;
  };

  const comparisonRows = buildComparisonRows(PLANS);

  return (
    <div className="bg-background">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14">
        <div className="warm-aura absolute inset-0 -z-10" />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <Reveal as="div" y={12} className="inline-flex items-center gap-2.5 mb-6">
            <span className="h-px w-8 bg-primary/60" />
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Tarifs transparents
            </span>
            <span className="h-px w-8 bg-primary/60" />
          </Reveal>

          <TextReveal
            as="h1"
            className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] lg:leading-[1.02] text-foreground text-balance"
          >
            Un prix honnête pour{' '}
            <span className="font-display-italic text-gradient-warm">chaque restaurant</span>
          </TextReveal>

          <Reveal as="p" delay={0.15} className="text-lg text-muted-foreground max-w-xl mx-auto mt-5 mb-8">
            Essai 14 jours gratuit sur tous les plans. Aucune carte de crédit requise.
            Changez de plan à tout moment.
          </Reveal>

          {/* Billing toggle */}
          <Reveal as="div" delay={0.25} className="inline-flex items-center gap-3">
            <span className={cn('text-sm font-medium transition-colors', billing === 'monthly' ? 'text-foreground' : 'text-muted-foreground')}>
              Mensuel
            </span>
            <button
              onClick={() => setBilling((b) => (b === 'monthly' ? 'annual' : 'monthly'))}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors duration-300',
                billing === 'annual' ? 'bg-primary' : 'bg-muted',
              )}
              aria-label="Basculer la facturation annuelle"
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-card shadow-sm transition-transform duration-300',
                billing === 'annual' ? 'translate-x-5' : 'translate-x-0',
              )} />
            </button>
            <span className={cn('text-sm font-medium transition-colors', billing === 'annual' ? 'text-foreground' : 'text-muted-foreground')}>
              Annuel
            </span>
            {billing === 'annual' && (
              <Badge className="bg-success/12 text-success text-[11px] font-semibold border-0">
                Économisez ~20 %
              </Badge>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── Plan cards ── */}
      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
          ) : (
          <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch" stagger={0.1}>
            {PLANS.map((plan) => {
              const Icon      = planIcon(plan);
              const isPopular = !!plan.badge && !plan.comingSoon;
              const price     = getPrice(plan);
              const saved     = savings(plan);

              return (
                <div
                  key={plan.key}
                  className={cn(
                    'relative rounded-3xl bg-card flex flex-col overflow-hidden transition-all duration-300',
                    isPopular
                      ? 'border-2 border-primary shadow-xl shadow-primary/10 md:-translate-y-2'
                      : plan.comingSoon
                      ? 'border border-dashed border-border opacity-75'
                      : 'border border-border shadow-sm hover:shadow-lg',
                  )}
                >
                  {plan.comingSoon ? (
                    <div className="py-2.5 text-center text-xs font-semibold tracking-widest uppercase bg-muted text-muted-foreground">
                      En cours de développement
                    </div>
                  ) : isPopular ? (
                    <div className="py-2.5 text-center text-xs font-semibold tracking-widest uppercase bg-primary text-primary-foreground inline-flex items-center justify-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> {plan.badge ?? 'Le plus populaire'}
                    </div>
                  ) : plan.badge ? (
                    <div className="py-2.5 text-center text-xs font-semibold tracking-widest uppercase bg-muted text-muted-foreground">
                      {plan.badge}
                    </div>
                  ) : null}

                  <div className="p-8 flex flex-col flex-1">
                    <div className="mb-6">
                      <div className="flex items-center gap-2.5 mb-2">
                        {Icon && (
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <h3 className="font-display text-2xl text-foreground">{plan.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                    </div>

                    <div className="mb-7">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-5xl text-foreground tabular-nums">
                          {price}{currencySymbol(plan.currency)}
                        </span>
                        <span className="text-sm text-muted-foreground">/ mois</span>
                      </div>
                      {billing === 'annual' && saved && (
                        <p className="text-xs text-success font-semibold mt-1">Soit {saved}{currencySymbol(plan.currency)} économisés / an</p>
                      )}
                      {billing === 'annual' && price > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">Facturé {price * 12}{currencySymbol(plan.currency)} annuellement</p>
                      )}
                    </div>

                    <ul className="mb-8 space-y-2.5 flex-grow">
                      {plan.highlights.map((perk) => (
                        <li key={perk} className="flex items-center gap-2.5 text-sm">
                          <Check className="h-4 w-4 text-success shrink-0" />
                          <span className="text-foreground/80">{perk}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.comingSoon ? (
                      <Button size="lg" disabled className="w-full h-12 rounded-full font-semibold">
                        Bientôt disponible
                      </Button>
                    ) : isPopular ? (
                      <Magnetic strength={0.3} block>
                        <Button asChild size="lg" className="w-full h-12 rounded-full font-semibold gap-2 shadow-lg shadow-primary/20">
                          <Link href={planHref(plan)}>
                            {planCta(plan)}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </Magnetic>
                    ) : (
                      <Button asChild size="lg" variant="outline" className="w-full h-12 rounded-full font-semibold gap-2">
                        <Link href={planHref(plan)}>
                          {planCta(plan)}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}

                    {isPopular && (
                      <p className="text-center text-[11px] text-muted-foreground mt-3">
                        Sans carte de crédit · Annulation libre
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </Stagger>
          )}
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="py-8 border-y border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            {TRUST.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Comparatif complet"
            title={<>Toutes les fonctionnalités, <span className="font-display-italic text-gradient-warm">côte à côte</span></>}
          />

          <Reveal as="div" y={24} className="mt-12 overflow-x-auto">
            <div
              className="min-w-[640px] rounded-3xl border border-border overflow-hidden shadow-sm"
              style={{ ['--cols' as string]: PLANS.length }}
            >
              {/* Header */}
              <div
                className="grid bg-muted/60 border-b border-border"
                style={{ gridTemplateColumns: `1.4fr repeat(${PLANS.length}, 1fr)` }}
              >
                <div className="p-4 font-semibold text-sm text-muted-foreground">Fonctionnalité</div>
                {PLANS.map((p) => (
                  <div key={p.key} className={cn(
                    'p-4 text-center text-sm font-semibold',
                    p.badge ? 'text-primary bg-primary/5' : 'text-foreground',
                  )}>
                    {p.name}
                  </div>
                ))}
              </div>

              {comparisonRows.map((row, i) => (
                <div
                  key={row.label}
                  className={cn(
                    'grid border-b border-border last:border-0',
                    i % 2 === 0 ? 'bg-card' : 'bg-muted/20',
                  )}
                  style={{ gridTemplateColumns: `1.4fr repeat(${PLANS.length}, 1fr)` }}
                >
                  <div className="p-4 text-sm text-foreground/80 font-medium">{row.label}</div>
                  {PLANS.map((p) => (
                    <div
                      key={p.key}
                      className={cn(
                        'p-4 text-center flex items-center justify-center',
                        p.badge && 'bg-primary/[0.04]',
                      )}
                    >
                      <CellValue value={row.get(p)} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-24 bg-card">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading eyebrow="FAQ" title={<>Questions <span className="font-display-italic text-gradient-warm">fréquentes</span></>} />

          <Stagger className="mt-12 space-y-3" stagger={0.06} y={14}>
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </Stagger>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Autre question ?{' '}
            <Link href="/contact" className="text-primary font-semibold hover:underline">
              Contactez notre équipe
            </Link>
          </p>
        </div>
      </section>

      <SaasCTAInline />
    </div>
  );
}

/* CTA final — variante inline (le composant partagé SaasCTA vit côté serveur ;
   ici on reste dans un fichier client, on réutilise donc le même langage visuel). */
function SaasCTAInline() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] bg-foreground text-background px-6 py-14 sm:px-16 sm:py-20 overflow-hidden text-center">
          <div className="absolute inset-0 opacity-50 [background:radial-gradient(50%_60%_at_80%_0%,oklch(0.645_0.205_44/0.55),transparent_70%),radial-gradient(40%_50%_at_10%_100%,oklch(0.8_0.15_78/0.35),transparent_70%)]" />
          <div className="relative max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/10 px-3 py-1 text-xs font-semibold text-primary mb-5">
              <Sparkles className="h-3 w-3" /> Essai gratuit 14 jours · Sans engagement
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[3rem] lg:leading-[1.05] text-background text-balance">
              Lancez-vous <span className="font-display-italic text-gradient-warm">aujourd’hui</span>
            </h2>
            <p className="mt-5 text-lg text-background/70 leading-relaxed">
              Rejoignez les restaurateurs qui ont déjà digitalisé leur établissement avec Flash Menu.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Magnetic strength={0.4}>
                <Button asChild size="lg" className="h-14 px-9 text-base font-semibold rounded-full shadow-xl shadow-primary/30">
                  <Link href="/auth/register">Commencer gratuitement<ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </Magnetic>
              <Button asChild size="lg" variant="outline" className="h-14 px-9 text-base rounded-full bg-transparent border-background/25 text-background hover:bg-background/10 hover:text-background">
                <Link href="/contact?subject=demo">Demander une démo</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
