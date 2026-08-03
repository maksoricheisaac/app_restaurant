import Image from "next/image"
import { Reveal } from "@/components/motion/reveal"
import { TextReveal } from "@/components/motion/text-reveal"

export const AboutStory = () => {
  return (
    <section className="py-20 sm:py-28 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Visuel */}
          <Reveal x={-30} y={0} className="order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-4 -z-10 bg-gradient-to-tr from-primary/12 to-amber-200/25 blur-3xl rounded-[2.5rem]" />
              <Image
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop"
                alt="La salle du restaurant"
                width={2070}
                height={1380}
                className="rounded-3xl border border-border shadow-xl w-full h-auto object-cover"
              />
            </div>
          </Reveal>

          {/* Texte */}
          <div className="order-1 lg:order-2">
            <Reveal as="div" y={12} className="inline-flex items-center gap-2.5 mb-5">
              <span className="h-px w-8 bg-primary/60" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Notre histoire
              </span>
            </Reveal>

            <TextReveal
              as="h2"
              className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.05] text-foreground text-balance"
            >
              Une maison, une{" "}
              <span className="font-display-italic text-gradient-warm">équipe</span>.
            </TextReveal>

            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed text-lg">
              <Reveal as="p" delay={0.05}>
                Tout commence en cuisine, tôt le matin, avec les livraisons du jour. Ce
                qui arrive de bon décide de ce qui sera servi le soir &mdash; et non l&apos;inverse.
              </Reveal>
              <Reveal as="p" delay={0.12}>
                En salle, la même exigence : accueillir, conseiller, laisser le temps au
                repas. Nos outils sont là pour effacer l&apos;attente inutile, pas pour
                remplacer la relation.
              </Reveal>
              <Reveal as="p" delay={0.18} className="text-foreground font-medium">
                Vous pouvez consulter la carte, commander ou réserver en quelques
                secondes. Le reste, c&apos;est notre affaire.
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
