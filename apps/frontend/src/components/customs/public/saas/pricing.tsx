import { Button } from "@/components/ui/button"
import { Check, X, Zap, Crown } from "lucide-react"
import Link from "next/link"
import { PLANS } from "@/config/plans"
import type { PlanId } from "@/config/plans"

const PLAN_ICONS: Partial<Record<PlanId, typeof Zap>> = {
  pro:        Zap,
  enterprise: Crown,
}

const PLAN_HREFS: Record<PlanId, string> = {
  free:       '/auth/register',
  pro:        '/auth/register?plan=pro',
  enterprise: '/contact?subject=enterprise',
}

const PLAN_CTAS: Record<PlanId, string> = {
  free:       'Commencer gratuitement',
  pro:        'Essayer 14 jours gratuit',
  enterprise: 'Contacter la vente',
}

export const SaasPricing = () => {
  return (
    <section id="pricing" className="py-24 bg-slate-50/60">
      <div className="container px-4 mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-4">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Tarifs</span>
          <h2 className="text-3xl lg:text-4xl font-black mt-2 mb-4 text-slate-900">
            Un prix honnête pour chaque restaurant
          </h2>
          <p className="text-slate-500 text-lg">
            Essai gratuit 14 jours sur tous les plans. Aucune carte de crédit requise.
          </p>
        </div>

        {/* Trust bar */}
        <div className="flex items-center justify-center gap-6 mb-12 text-sm text-slate-500">
          <span>✓ Sans engagement</span>
          <span>✓ Annulation instantanée</span>
          <span>✓ Migration gratuite</span>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => {
            const Icon = PLAN_ICONS[plan.id];
            const isPopular = plan.id === 'pro';
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl border flex flex-col overflow-hidden transition-all ${
                  isPopular
                    ? "border-primary shadow-xl shadow-orange-100 ring-1 ring-primary"
                    : plan.comingSoon
                    ? "border-dashed border-slate-200 opacity-70"
                    : "shadow-sm hover:shadow-md"
                }`}
              >
                {isPopular && (
                  <div className="bg-primary text-white text-xs font-bold text-center py-2 tracking-wider uppercase">
                    ⚡ Le plus populaire
                  </div>
                )}
                {plan.comingSoon && (
                  <div className="bg-slate-100 text-slate-500 text-xs font-bold text-center py-2 tracking-wider uppercase">
                    🚧 En cours de développement
                  </div>
                )}
                <div className="p-8 flex flex-col flex-1">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      {Icon && <Icon className="h-5 w-5 text-primary" />}
                      <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                    </div>
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      Idéal pour : {plan.tagline}
                    </span>
                    <p className="text-slate-500 text-sm mt-2">{plan.description}</p>
                  </div>

                  <div className="mb-8 flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-900">
                      {plan.monthlyPrice === 0 ? '0' : plan.monthlyPrice}€
                    </span>
                    <span className="text-slate-400 text-sm">/ mois</span>
                  </div>

                  <ul className="mb-8 space-y-3 flex-grow">
                    {plan.features.map((f) => (
                      <li key={f.label} className="flex items-start gap-2.5 text-sm">
                        {f.included ? (
                          <Check className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-slate-300 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={f.included ? "text-slate-700" : "text-slate-400"}>
                          {f.value ? `${f.label} : ${f.value}` : f.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild={!plan.comingSoon}
                    size="lg"
                    variant={isPopular ? "default" : "outline"}
                    disabled={plan.comingSoon}
                    className="w-full rounded-full h-12 font-bold"
                  >
                    {plan.comingSoon
                      ? <span>Bientôt disponible</span>
                      : <Link href={PLAN_HREFS[plan.id]}>{PLAN_CTAS[plan.id]}</Link>
                    }
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-slate-400 mt-10">
          Paiement sécurisé · TVA en sus selon localisation · Prix en EUR
        </p>
      </div>
    </section>
  )
}
