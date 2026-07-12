import { Button } from "@/components/ui/button"
import { ArrowRight, PlayCircle, ShoppingBag, TrendingUp, Clock, ChefHat, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Reveal } from "@/components/motion/reveal"
import { TextReveal } from "@/components/motion/text-reveal"
import { Magnetic } from "@/components/motion/magnetic"

const STATS = [
  { value: "2 min", label: "pour tout activer" },
  { value: "3×", label: "plus de commandes" },
  { value: "0 €", label: "sans carte de crédit" },
]

const TRUST_BADGES = [
  { icon: ShoppingBag, text: "+500 restaurants" },
  { icon: TrendingUp, text: "98 % de satisfaction" },
  { icon: Clock, text: "Support 7j/7" },
]

export const SaasHero = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Halo chaud */}
      <div className="warm-aura absolute inset-0 -z-10" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px rule-warm" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* ── Colonne texte ── */}
          <div className="lg:col-span-6">
            {/* Eyebrow */}
            <Reveal as="div" y={14} className="inline-flex items-center gap-2.5 mb-7">
              <span className="h-px w-8 bg-primary/60" />
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Plateforme de gestion restaurant
              </span>
            </Reveal>

            {/* Titre éditorial */}
            <TextReveal
              as="h1"
              className="font-display text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[4.25rem] lg:leading-[0.98] text-foreground text-balance"
            >
              Votre restaurant,{" "}
              <span className="font-display-italic text-gradient-warm">enfin piloté</span>{" "}
              en temps réel.
            </TextReveal>

            <Reveal
              as="p"
              delay={0.15}
              className="mt-6 max-w-xl text-lg sm:text-xl text-muted-foreground leading-relaxed"
            >
              Menu QR, commandes en ligne, cuisine connectée, caisse et réservations —
              réunis dans une seule interface claire. Mis en route en deux minutes,
              sans matériel ni informaticien.
            </Reveal>

            {/* CTAs */}
            <Reveal as="div" delay={0.28} className="mt-9 flex flex-col sm:flex-row gap-3">
              <Magnetic strength={0.4}>
                <Button
                  asChild
                  size="lg"
                  className="h-14 px-8 text-base font-semibold rounded-full shadow-lg shadow-primary/20"
                >
                  <Link href="/auth/register">
                    Démarrer gratuitement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </Magnetic>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-14 px-6 text-base rounded-full text-foreground hover:bg-accent"
              >
                <Link href="#workflow">
                  <PlayCircle className="mr-2 h-5 w-5 text-primary" />
                  Voir comment ça marche
                </Link>
              </Button>
            </Reveal>

            {/* Stats + confiance */}
            <Reveal as="div" delay={0.4} className="mt-12">
              <div className="flex items-stretch gap-6 sm:gap-8">
                {STATS.map((stat, i) => (
                  <div key={stat.label} className="flex items-stretch gap-6 sm:gap-8">
                    {i > 0 && <span className="w-px bg-border" />}
                    <div>
                      <p className="font-display text-3xl text-foreground tabular-nums">{stat.value}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
                {TRUST_BADGES.map((b) => (
                  <div key={b.text} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <b.icon className="h-4 w-4 text-primary" />
                    <span className="font-medium">{b.text}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* ── Colonne visuelle ── */}
          <div className="lg:col-span-6 lg:pl-6">
            <Reveal x={40} y={0} duration={1} className="relative">
              {/* Lueur derrière la maquette */}
              <div className="absolute -inset-6 -z-10 bg-gradient-to-tr from-primary/15 via-amber-200/20 to-transparent blur-3xl rounded-[3rem]" />

              <div className="relative rounded-3xl border border-border bg-card p-3 shadow-2xl">
                {/* Chrome navigateur */}
                <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-border mb-2">
                  <span className="h-3 w-3 rounded-full bg-destructive/70" />
                  <span className="h-3 w-3 rounded-full bg-warning/80" />
                  <span className="h-3 w-3 rounded-full bg-success/70" />
                  <div className="flex-1 mx-3 h-6 rounded-md bg-muted text-[11px] flex items-center px-3 text-muted-foreground font-mono">
                    app.flashmenu.app/admin
                  </div>
                </div>
                <Image
                  src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2070&auto=format&fit=crop"
                  alt="Tableau de bord Flash Menu en temps réel"
                  width={2070}
                  height={1380}
                  className="rounded-2xl w-full h-auto"
                  priority
                />
              </div>

              {/* Carte flottante — nouvelle commande */}
              <div className="animate-float absolute -bottom-5 -left-4 sm:-left-8 bg-card rounded-2xl shadow-xl border border-border px-4 py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-success/12 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Nouvelle commande</p>
                  <p className="text-xs text-muted-foreground tabular-nums">Table 4 · 3 500 FCFA</p>
                </div>
              </div>

              {/* Carte flottante — cuisine */}
              <div className="animate-float-slow absolute -top-5 -right-3 sm:-right-6 bg-card rounded-2xl shadow-xl border border-border px-4 py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/12 flex items-center justify-center">
                  <ChefHat className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Cuisine · prêt</p>
                  <p className="text-xs text-muted-foreground">Temps moyen 11 min</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
