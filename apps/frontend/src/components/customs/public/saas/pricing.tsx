import { Button } from "@/components/ui/button"
import { Check, X, Zap, Crown } from "lucide-react"
import Link from "next/link"

const PLANS = [
  {
    id: "free",
    name: "Gratuit",
    price: "0",
    bestFor: "Petits établissements",
    description: "Pour tester Flash Menu sans risque.",
    icon: null,
    popular: false,
    cta: "Commencer gratuitement",
    href: "/auth/register",
    features: [
      { label: "10 commandes / mois", included: true },
      { label: "5 articles au menu", included: true },
      { label: "3 tables + QR codes", included: true },
      { label: "2 comptes staff", included: true },
      { label: "Dashboard de base", included: true },
      { label: "Rapports avancés", included: false },
      { label: "Kitchen Display System", included: false },
      { label: "Commandes illimitées", included: false },
      { label: "Notifications email", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "29",
    bestFor: "Restaurants 10–50 tables",
    description: "Tout ce qu'il faut pour opérer à plein régime.",
    icon: Zap,
    popular: true,
    cta: "Essayer 14 jours gratuit",
    href: "/auth/register?plan=pro",
    features: [
      { label: "Commandes illimitées", included: true },
      { label: "Menu illimité", included: true },
      { label: "10 tables + QR codes", included: true },
      { label: "5 comptes staff", included: true },
      { label: "Dashboard complet", included: true },
      { label: "Rapports avancés", included: true },
      { label: "Kitchen Display System", included: true },
      { label: "Notifications email", included: true },
      { label: "Multi-établissements", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "99",
    bestFor: "Chaînes & multi-sites",
    description: "Pour les restaurants à fort volume.",
    icon: Crown,
    popular: false,
    cta: "Contacter la vente",
    href: "/contact",
    features: [
      { label: "Commandes illimitées", included: true },
      { label: "Menu illimité", included: true },
      { label: "Tables illimitées", included: true },
      { label: "Staff illimité", included: true },
      { label: "Tout ce qu'offre Pro", included: true },
      { label: "Rapports personnalisés", included: true },
      { label: "Kitchen Display System", included: true },
      { label: "Notifications SMS + email", included: true },
      { label: "Multi-établissements", included: true },
    ],
  },
]

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
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl border flex flex-col overflow-hidden transition-all ${
                  plan.popular
                    ? "border-primary shadow-xl shadow-orange-100 ring-1 ring-primary"
                    : "shadow-sm hover:shadow-md"
                }`}
              >
                {plan.popular && (
                  <div className="bg-primary text-white text-xs font-bold text-center py-2 tracking-wider uppercase">
                    ⚡ Le plus populaire
                  </div>
                )}
                <div className="p-8 flex flex-col flex-1">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      {Icon && <Icon className="h-5 w-5 text-primary" />}
                      <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                    </div>
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      Idéal pour : {plan.bestFor}
                    </span>
                    <p className="text-slate-500 text-sm mt-2">{plan.description}</p>
                  </div>

                  <div className="mb-8 flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-900">{plan.price}€</span>
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
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    size="lg"
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full rounded-full h-12 font-bold"
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-slate-400 mt-10">
          Paiement sécurisé par Stripe · TVA en sus selon localisation · Prix en EUR
        </p>
      </div>
    </section>
  )
}
