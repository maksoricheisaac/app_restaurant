import { Reveal } from "@/components/motion/reveal"
import { TextReveal } from "@/components/motion/text-reveal"

export const AboutHero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="warm-aura absolute inset-0 -z-10" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 lg:pt-24 text-center">
        <Reveal as="div" y={12} className="inline-flex items-center gap-2.5 mb-7">
          <span className="h-px w-8 bg-primary/60" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Notre mission
          </span>
          <span className="h-px w-8 bg-primary/60" />
        </Reveal>

        <TextReveal
          as="h1"
          className="font-display text-[2.5rem] leading-[1.05] sm:text-6xl lg:text-[4rem] lg:leading-[1] text-foreground text-balance"
        >
          La technologie au service des restaurateurs,{" "}
          <span className="font-display-italic text-gradient-warm">pas l’inverse</span>.
        </TextReveal>

        <Reveal as="p" delay={0.15} className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Flash Menu est née d’une conviction simple : un bon outil doit disparaître
          derrière le métier. Nous construisons la plateforme que nous aurions voulue
          quand nous étions, nous aussi, débordés en plein service.
        </Reveal>
      </div>
    </section>
  )
}
