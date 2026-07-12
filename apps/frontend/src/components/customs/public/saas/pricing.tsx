'use client'

import { Button } from "@/components/ui/button"
import { Check, Zap, Crown, ShieldCheck, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"
import { currencySymbol, type PlanCatalog } from "@/config/plans"
import { usePlanCatalog } from "@/hooks/api/usePlans"
import { SectionHeading } from "./section-heading"
import { Stagger } from "@/components/motion/stagger"
import { Magnetic } from "@/components/motion/magnetic"

function planIcon(plan: PlanCatalog) {
  if (plan.key === 'enterprise') return Crown
  if (plan.monthlyPrice > 0) return Zap
  return null
}
function planHref(plan: PlanCatalog) {
  if (plan.comingSoon) return '/contact?subject=' + plan.key
  return plan.monthlyPrice > 0 ? `/auth/register?plan=${plan.key}` : '/auth/register'
}
function planCta(plan: PlanCatalog) {
  if (plan.comingSoon) return 'Contacter la vente'
  return plan.monthlyPrice > 0 ? 'Choisir ce plan' : 'Commencer gratuitement'
}

const TRUST = ["Sans engagement", "Annulation instantanée", "Migration gratuite"]

export const SaasPricing = () => {
  const { plans, isLoading } = usePlanCatalog()

  return (
    <section id="pricing" className="relative py-24 sm:py-32 bg-background overflow-hidden">
      <div className="warm-aura absolute inset-0 -z-10 opacity-70" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <SectionHeading
          eyebrow="Tarifs"
          title={<>Un prix honnête pour <span className="font-display-italic text-gradient-warm">chaque restaurant</span></>}
          description="Essai gratuit de 14 jours sur tous les plans. Aucune carte de crédit requise pour commencer."
        />

        {/* Trust bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {TRUST.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-success" />
              {t}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : (
        <Stagger className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch" stagger={0.1}>
          {(plans ?? []).map((plan) => {
            const Icon = planIcon(plan)
            const isPopular = !!plan.badge && !plan.comingSoon
            return (
              <div
                key={plan.key}
                className={`relative bg-card rounded-3xl flex flex-col overflow-hidden transition-all duration-300 ${
                  isPopular
                    ? "border-2 border-primary shadow-xl shadow-primary/10 md:-translate-y-2"
                    : plan.comingSoon
                    ? "border border-dashed border-border opacity-75"
                    : "border border-border shadow-sm hover:shadow-lg"
                }`}
              >
                {isPopular && (
                  <div className="bg-primary text-primary-foreground text-xs font-semibold text-center py-2 tracking-widest uppercase inline-flex items-center justify-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> {plan.badge ?? 'Le plus populaire'}
                  </div>
                )}
                {plan.comingSoon && (
                  <div className="bg-muted text-muted-foreground text-xs font-semibold text-center py-2 tracking-widest uppercase">
                    En cours de développement
                  </div>
                )}
                <div className="p-8 flex flex-col flex-1">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      {Icon && <Icon className="h-5 w-5 text-primary" />}
                      <h3 className="font-display text-2xl text-foreground">{plan.name}</h3>
                    </div>
                    {plan.tagline && (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                        Idéal pour : {plan.tagline}
                      </span>
                    )}
                    {plan.description && (
                      <p className="text-muted-foreground text-sm mt-3 leading-relaxed">{plan.description}</p>
                    )}
                  </div>

                  <div className="mb-8 flex items-baseline gap-1">
                    <span className="font-display text-5xl text-foreground tabular-nums">
                      {plan.monthlyPrice === 0 ? '0' : plan.monthlyPrice}{currencySymbol(plan.currency)}
                    </span>
                    <span className="text-muted-foreground text-sm">/ mois</span>
                  </div>

                  <ul className="mb-8 space-y-3 flex-grow">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-foreground/80">{h}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.comingSoon ? (
                    <Button size="lg" disabled className="w-full rounded-full h-12 font-semibold">
                      Bientôt disponible
                    </Button>
                  ) : isPopular ? (
                    <Magnetic strength={0.3} block>
                      <Button asChild size="lg" className="w-full rounded-full h-12 font-semibold shadow-lg shadow-primary/20">
                        <Link href={planHref(plan)}>{planCta(plan)}</Link>
                      </Button>
                    </Magnetic>
                  ) : (
                    <Button asChild size="lg" variant="outline" className="w-full rounded-full h-12 font-semibold">
                      <Link href={planHref(plan)}>{planCta(plan)}</Link>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </Stagger>
        )}

        <p className="text-center text-xs text-muted-foreground mt-10 inline-flex items-center justify-center gap-1.5 w-full">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Paiement sécurisé · TVA en sus selon localisation
        </p>
      </div>
    </section>
  )
}
