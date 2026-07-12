import { Reveal } from "@/components/motion/reveal"

// Logotypes clients "wordmark" (texte) — pas de faux logos d'entreprises réelles.
// Ils évoquent des enseignes de restauration sans usurper une marque existante.
const LOGOS = [
  "Le Palais du Goût",
  "Chez Amina",
  "Saveurs d'Afrique",
  "Maison Kettly",
  "Le Baobab",
  "Table 21",
]

export const SaasSocialProof = () => {
  return (
    <section className="border-y border-border bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Reveal as="p" y={10} className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Ils pilotent leur salle avec Flash Menu
        </Reveal>
        <Reveal
          as="div"
          delay={0.1}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
        >
          {LOGOS.map((name) => (
            <span
              key={name}
              className="font-display text-lg sm:text-xl text-foreground/45 hover:text-foreground/80 transition-colors duration-300 whitespace-nowrap"
            >
              {name}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
