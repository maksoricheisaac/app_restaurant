import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, ShoppingBag, TrendingUp, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const STATS = [
  { value: "2 min", label: "Délai d'activation" },
  { value: "3×", label: "Plus de commandes" },
  { value: "0€", label: "Sans carte de crédit" },
]

const TRUST_BADGES = [
  { icon: ShoppingBag, text: "+500 restaurants" },
  { icon: TrendingUp, text: "98% de satisfaction" },
  { icon: Clock, text: "Support 7j/7" },
]

export const SaasHero = () => {
  return (
    <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      {/* Background blur */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 h-80 w-80 rounded-full bg-orange-200/30 blur-3xl" />
      </div>

      <div className="container px-4 mx-auto">
        <div className="flex flex-wrap items-center -mx-4">
          {/* Left column — copy */}
          <div className="w-full lg:w-1/2 px-4 mb-16 lg:mb-0">
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-orange-50 border border-orange-200">
                <Zap className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">
                  Sans carte de crédit · Essai gratuit 14 jours
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-[1.1] tracking-tight text-slate-900">
                Prenez{" "}
                <span className="text-primary relative">
                  3× plus de commandes
                  <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 300 6" fill="none">
                    <path d="M0 5 Q150 0 300 5" stroke="#f97316" strokeWidth="3" fill="none" />
                  </svg>
                </span>{" "}
                sans effort supplémentaire
              </h1>

              {/* Subheadline */}
              <p className="text-xl text-slate-500 mb-8 leading-relaxed">
                Flash Menu digitalise votre restaurant en 2 minutes : menu QR, commandes en ligne,
                cuisine connectée et rapports en temps réel. Tout en un.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Button asChild size="lg" className="h-14 px-8 text-base font-bold rounded-full shadow-lg shadow-orange-200">
                  <Link href="/auth/register">
                    Démarrer gratuitement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base rounded-full">
                  <Link href="#features">Voir une démo</Link>
                </Button>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 mb-8">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-4">
                {TRUST_BADGES.map((b) => (
                  <div key={b.text} className="flex items-center gap-1.5 text-sm text-slate-500">
                    <b.icon className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — visual */}
          <div className="w-full lg:w-1/2 px-4">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/15 to-orange-100/40 blur-3xl rounded-full" />
              <div className="relative rounded-2xl border bg-card p-3 shadow-2xl shadow-slate-900/10">
                {/* Fake browser chrome */}
                <div className="flex items-center gap-1.5 px-3 py-2 border-b mb-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <div className="flex-1 mx-3 h-5 rounded-md bg-slate-100 text-[10px] flex items-center px-2 text-slate-400">
                    app.flashmenu.app/admin
                  </div>
                </div>
                <Image
                  src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2070&auto=format&fit=crop"
                  alt="Tableau de bord Flash Menu"
                  width={2070}
                  height={1380}
                  className="rounded-lg shadow-sm w-full h-auto"
                  priority
                />
                {/* Floating notification */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg border px-3 py-2.5 flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Nouvelle commande !</p>
                    <p className="text-[10px] text-slate-500">Table 4 · 3 500 FCFA</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
