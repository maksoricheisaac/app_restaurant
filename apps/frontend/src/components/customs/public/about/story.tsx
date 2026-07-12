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
                alt="L'équipe Flash Menu au travail en salle"
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
              Née en salle, pas dans un{" "}
              <span className="font-display-italic text-gradient-warm">open space</span>.
            </TextReveal>

            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed text-lg">
              <Reveal as="p" delay={0.05}>
                En 2023, après des années passées à jongler entre carnets de commandes,
                logiciels de caisse incompatibles et menus réimprimés chaque semaine, nous
                avons décidé de tout repenser depuis la salle.
              </Reveal>
              <Reveal as="p" delay={0.12}>
                L’idée : réunir menu digital, commandes, cuisine, caisse et réservations
                dans une seule interface, assez simple pour être adoptée en une après-midi,
                assez robuste pour tenir un coup de feu.
              </Reveal>
              <Reveal as="p" delay={0.18} className="text-foreground font-medium">
                Aujourd’hui, plus de 500 établissements pilotent leur activité avec Flash Menu.
                Notre boussole n’a pas changé : votre temps appartient à vos clients, pas à
                votre logiciel.
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
