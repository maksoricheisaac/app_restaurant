'use client';

import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import {
  Check, X, Zap, Crown, ArrowRight, Shield, RefreshCcw,
  HeartHandshake, ChevronDown, ChevronUp, CreditCard, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PLANS as PLANS_CONFIG } from '@/config/plans';
import type { PlanId } from '@/config/plans';

/* ─────────────────────────── types ─────────────────────────── */

type BillingCycle = 'monthly' | 'annual';

interface Feature {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
}

/* ─── UI metadata propre à cette page (icônes, hrefs, CTAs) ─── */

const PLAN_ICONS: Partial<Record<PlanId, typeof Zap>> = {
  pro:        Zap,
  enterprise: Crown,
};

const PLAN_HREFS: Record<PlanId, string> = {
  free:       '/auth/register',
  pro:        '/auth/register?plan=pro',
  enterprise: '/contact?subject=enterprise',
};

const PLAN_CTAS: Record<PlanId, string> = {
  free:       'Commencer gratuitement',
  pro:        'Essayer 14 jours gratuit',
  enterprise: 'Contacter l\'équipe vente',
};

/* Alias pour garder le reste du JSX inchangé */
const PLANS = PLANS_CONFIG;

const FEATURES: Feature[] = [
  { label: 'Commandes / mois',         free: '10',        pro: 'Illimité',  enterprise: 'Illimité'  },
  { label: 'Articles au menu',          free: '5',         pro: 'Illimité',  enterprise: 'Illimité'  },
  { label: 'Tables + QR codes',         free: '3',         pro: '10',        enterprise: 'Illimité'  },
  { label: 'Comptes staff',             free: '2',         pro: '5',         enterprise: 'Illimité'  },
  { label: 'Kitchen Display System',    free: false,       pro: true,        enterprise: true        },
  { label: 'Rapports & analytics',      free: 'Basique',   pro: 'Complets',  enterprise: 'Avancés'   },
  { label: 'Notifications email',       free: false,       pro: true,        enterprise: true        },
  { label: 'Notifications SMS',         free: false,       pro: false,       enterprise: true        },
  { label: 'Multi-établissements',      free: false,       pro: false,       enterprise: true        },
  { label: 'API & webhooks',            free: false,       pro: false,       enterprise: true        },
  { label: 'Onboarding dédié',          free: false,       pro: false,       enterprise: true        },
  { label: 'Support prioritaire',       free: 'Email',     pro: 'Chat + Email', enterprise: 'Dédié 24/7' },
  { label: 'SLA de disponibilité',      free: false,       pro: '99,5 %',    enterprise: '99,9 %'    },
  { label: 'Conformité RGPD',           free: true,        pro: true,        enterprise: true        },
  { label: 'Intégration paiement',       free: false,       pro: true,        enterprise: true        },
];

const FAQS = [
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui. Vous pouvez upgrader instantanément depuis votre tableau de bord. En cas de downgrade, le changement prend effet à la fin de la période en cours.',
  },
  {
    q: 'Comment fonctionne l\'essai gratuit 14 jours ?',
    a: 'Vous accédez à toutes les fonctionnalités du plan Pro pendant 14 jours, sans carte de crédit requise. À la fin de l\'essai, vous choisissez un plan ou passez au Gratuit.',
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
  { icon: CreditCard,    text: 'Sans carte pour l\'essai' },
];

/* ─────────────────────────── helpers ───────────────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };

function CellValue({ value }: { value: string | boolean }) {
  if (value === true)  return <Check className="h-5 w-5 text-primary mx-auto" />;
  if (value === false) return <X     className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm font-medium text-foreground">{value}</span>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      layout
      className="border border-border rounded-2xl overflow-hidden cursor-pointer"
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-5 hover:bg-muted/30 transition-colors">
        <span className="text-sm font-semibold text-foreground">{q}</span>
        {open
          ? <ChevronUp   className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>
      {open && (
        <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border bg-muted/10">
          <p className="pt-4">{a}</p>
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────── main component ─────────────────── */

export default function PricingPageClient() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');

  const getPrice = (plan: typeof PLANS[number]) =>
    billing === 'annual' ? plan.annualPrice : plan.monthlyPrice;

  const savings = (plan: typeof PLANS[number]) => {
    if (plan.id === 'free') return null;
    const saved = (plan.monthlyPrice - plan.annualPrice) * 12;
    return saved > 0 ? saved : null;
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-12 sm:pt-32 sm:pb-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 right-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-16 -left-24 h-80 w-80 rounded-full bg-violet-500/4 blur-3xl" />
        </div>

        <motion.div
          className="mx-auto max-w-3xl px-4 sm:px-6 text-center"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Tarifs transparents, sans surprise
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground mb-5"
          >
            Un prix honnête pour{' '}
            <span className="text-primary">chaque restaurant</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg text-muted-foreground max-w-xl mx-auto mb-8"
          >
            Essai 14 jours gratuit sur tous les plans. Aucune carte de crédit requise.
            Changez de plan à tout moment.
          </motion.p>

          {/* Billing toggle */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-3 mb-6">
            <span className={cn('text-sm font-medium transition-colors', billing === 'monthly' ? 'text-foreground' : 'text-muted-foreground')}>
              Mensuel
            </span>
            <button
              onClick={() => setBilling((b) => b === 'monthly' ? 'annual' : 'monthly')}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors duration-300',
                billing === 'annual' ? 'bg-primary' : 'bg-muted',
              )}
              aria-label="Basculer facturation annuelle"
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300',
                billing === 'annual' ? 'translate-x-5' : 'translate-x-0',
              )} />
            </button>
            <span className={cn('text-sm font-medium transition-colors', billing === 'annual' ? 'text-foreground' : 'text-muted-foreground')}>
              Annuel
            </span>
            {billing === 'annual' && (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[11px] font-bold border-0">
                Économisez ~20 %
              </Badge>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Plan cards ── */}
      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {PLANS.map((plan) => {
              const Icon      = PLAN_ICONS[plan.id];
              const isPopular = plan.id === 'pro';
              const price     = getPrice(plan);
              const saved     = savings(plan);

              return (
                <motion.div
                  key={plan.id}
                  variants={fadeUp}
                  className={cn(
                    'relative rounded-3xl border bg-card flex flex-col overflow-hidden transition-all duration-300',
                    isPopular
                      ? 'border-primary shadow-xl shadow-primary/10 ring-1 ring-primary scale-[1.02] hover:shadow-2xl'
                      : plan.comingSoon
                      ? 'border-dashed border-border/60 opacity-70 shadow-sm'
                      : 'shadow-sm hover:shadow-lg',
                  )}
                >
                  {/* Badge populaire ou "bientôt dispo" */}
                  {plan.comingSoon ? (
                    <div className="py-2.5 text-center text-xs font-bold tracking-wider uppercase bg-muted text-muted-foreground">
                      🚧 En cours de développement
                    </div>
                  ) : plan.badge ? (
                    <div className={cn(
                      'py-2.5 text-center text-xs font-bold tracking-wider uppercase',
                      isPopular ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}>
                      {plan.badge}
                    </div>
                  ) : null}

                  <div className="p-8 flex flex-col flex-1">
                    {/* Header */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2.5 mb-1">
                        {Icon && (
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <h3 className="text-xl font-black text-foreground">{plan.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-7">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-5xl font-black text-foreground tabular-nums">
                          {price}€
                        </span>
                        <span className="text-sm text-muted-foreground">/ mois</span>
                      </div>
                      {billing === 'annual' && saved && (
                        <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                          Soit {saved}€ économisés / an
                        </p>
                      )}
                      {billing === 'annual' && price > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Facturé {price * 12}€ annuellement
                        </p>
                      )}
                    </div>

                    {/* Perks */}
                    <ul className="mb-8 space-y-2.5 flex-grow">
                      {plan.highlights.map((perk) => (
                        <li key={perk} className="flex items-center gap-2.5 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-foreground/80">{perk}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      asChild={!plan.comingSoon}
                      size="lg"
                      variant={isPopular ? 'default' : 'outline'}
                      disabled={plan.comingSoon}
                      className={cn(
                        'w-full h-12 rounded-2xl font-bold gap-2',
                        isPopular && 'shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow',
                      )}
                    >
                      {plan.comingSoon ? (
                        <span>Bientôt disponible</span>
                      ) : (
                        <Link href={PLAN_HREFS[plan.id]}>
                          {PLAN_CTAS[plan.id]}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </Button>

                    {plan.id === 'pro' && (
                      <p className="text-center text-[11px] text-muted-foreground mt-3">
                        Sans carte de crédit · Annulation libre
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="py-8 border-y border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
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
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">
                Comparatif complet
              </span>
              <h2 className="text-3xl font-black text-foreground">
                Toutes les fonctionnalités, côte à côte
              </h2>
            </div>

            <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
              {/* Table header */}
              <div className="grid grid-cols-4 bg-muted/50 border-b border-border">
                <div className="p-4 font-semibold text-sm text-muted-foreground">Fonctionnalité</div>
                {PLANS.map((p) => (
                  <div key={p.id} className={cn(
                    'p-4 text-center text-sm font-bold',
                    p.badge ? 'text-primary bg-primary/5' : 'text-foreground',
                  )}>
                    {p.name}
                    {p.badge && <span className="ml-1 text-[10px] align-super">★</span>}
                  </div>
                ))}
              </div>

              {/* Table rows */}
              {FEATURES.map((feat, i) => (
                <div
                  key={feat.label}
                  className={cn(
                    'grid grid-cols-4 border-b border-border last:border-0',
                    i % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                  )}
                >
                  <div className="p-4 text-sm text-foreground/80 font-medium">{feat.label}</div>
                  <div className="p-4 text-center"><CellValue value={feat.free} /></div>
                  <div className={cn('p-4 text-center', 'bg-primary/3')}>
                    <CellValue value={feat.pro} />
                  </div>
                  <div className="p-4 text-center"><CellValue value={feat.enterprise} /></div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">FAQ</span>
            <h2 className="text-3xl font-black text-foreground">Questions fréquentes</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Autre question ?{' '}
            <Link href="/contact" className="text-primary font-semibold hover:underline">
              Contactez notre équipe
            </Link>
          </p>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl bg-primary px-8 py-14 sm:px-14 sm:py-20 text-center text-primary-foreground shadow-2xl shadow-primary/30 relative overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            </div>

            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold mb-5">
                <Sparkles className="h-3 w-3" />
                Essai gratuit 14 jours · Sans engagement
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
                Lancez-vous aujourd'hui
              </h2>
              <p className="text-primary-foreground/80 text-base sm:text-lg mb-10 max-w-lg mx-auto">
                Rejoignez les restaurateurs qui ont déjà digitalisé leur établissement avec Flash Menu.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-bold shadow-xl h-13 px-8 rounded-2xl gap-2 text-base"
                >
                  <Link href="/auth/register">
                    Commencer gratuitement
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="text-primary-foreground hover:bg-white/10 font-semibold h-13 px-8 rounded-2xl text-base"
                >
                  <Link href="/contact?subject=demo">Demander une démo</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
