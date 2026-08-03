import { SectionHeading } from "@/components/customs/public/vitrine/section-heading"
import { Reveal } from "@/components/motion/reveal"

/** ⚠️ Contenu à personnaliser par le restaurant. */
const MILESTONES = [
  {
    year: "L'ouverture",
    title: "Une salle, une carte courte",
    description: "Quelques tables, une poignée de plats travaillés chaque jour. Le parti pris de départ : mieux vaut faire peu, et bien.",
  },
  {
    year: "La carte",
    title: "Les saisons prennent la main",
    description: "La carte se met à suivre les arrivages plutôt qu'un menu figé. Les habitués reviennent pour voir ce qui a changé.",
  },
  {
    year: "L'équipe",
    title: "La salle et la cuisine s'accordent",
    description: "Commandes, cuisine et caisse travaillent sur les mêmes informations. Moins d'allers-retours, plus de temps pour vous.",
  },
  {
    year: "Aujourd'hui",
    title: "Sur place, à emporter, livré",
    description: "La carte est consultable en ligne, la réservation prend quelques secondes, et le suivi de commande se fait en direct.",
  },
]

export const AboutTimeline = () => {
  return (
    <section className="py-20 sm:py-28 bg-card">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Le chemin parcouru"
          title={<>Notre <span className="font-display-italic text-gradient-warm">parcours</span></>}
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
