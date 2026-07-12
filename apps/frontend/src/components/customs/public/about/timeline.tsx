import { SectionHeading } from "@/components/customs/public/saas/section-heading"
import { Reveal } from "@/components/motion/reveal"

const MILESTONES = [
  {
    year: "2023",
    title: "Les premières lignes de code",
    description: "Trois personnes, un prototype de menu QR testé dans un seul restaurant partenaire. Le déclic : les commandes arrivent en cuisine sans erreur.",
  },
  {
    year: "2024",
    title: "La plateforme prend forme",
    description: "Kitchen Display, caisse et réservations rejoignent le menu. Les 100 premiers établissements adoptent Flash Menu.",
  },
  {
    year: "2025",
    title: "Passage à l’échelle",
    description: "Architecture multi-tenant, rapports temps réel et paiements en ligne. Le cap des 300 restaurants est franchi.",
  },
  {
    year: "2026",
    title: "Plus de 500 restaurants",
    description: "Onboarding en 2 minutes, support 7j/7 et une feuille de route dictée par la communauté. Et ce n’est qu’un début.",
  },
]

export const AboutTimeline = () => {
  return (
    <section className="py-20 sm:py-28 bg-card">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Le chemin parcouru"
          title={<>De l’idée à <span className="font-display-italic text-gradient-warm">500 restaurants</span></>}
        />

        <div className="mt-16 relative">
          {/* Ligne verticale */}
          <div className="absolute left-[1.15rem] sm:left-1/2 sm:-translate-x-1/2 top-2 bottom-2 w-px bg-border" aria-hidden />

          <ol className="space-y-10">
            {MILESTONES.map((m, i) => (
              <li key={m.year} className="relative">
                <Reveal
                  y={24}
                  delay={0.04 * i}
                  className="relative sm:grid sm:grid-cols-2 sm:items-center"
                >
                  {/* Pastille */}
                  <span className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 top-1 sm:top-1/2 sm:-translate-y-1/2 h-6 w-6 rounded-full bg-primary/15 ring-4 ring-background flex items-center justify-center z-10">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  </span>

                  {/* Carte — alternée gauche/droite en desktop */}
                  <div className={`ml-12 sm:ml-0 ${i % 2 === 0 ? "sm:pr-12 sm:text-right" : "sm:col-start-2 sm:pl-12"}`}>
                    <span className="font-display text-3xl text-gradient-warm">{m.year}</span>
                    <h3 className="text-lg font-semibold text-foreground mt-1 mb-1.5">{m.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
