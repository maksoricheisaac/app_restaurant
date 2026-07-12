import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Reveal } from "@/components/motion/reveal"
import { TextReveal } from "@/components/motion/text-reveal"
import { Magnetic } from "@/components/motion/magnetic"

export const SaasCTA = () => {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] bg-foreground text-background px-6 py-16 sm:px-16 sm:py-20 overflow-hidden">
          {/* Halo chaud */}
          <div className="absolute inset-0 opacity-50 [background:radial-gradient(50%_60%_at_80%_0%,oklch(0.645_0.205_44/0.55),transparent_70%),radial-gradient(40%_50%_at_10%_100%,oklch(0.8_0.15_78/0.35),transparent_70%)]" />

          <div className="relative text-center max-w-3xl mx-auto">
            <Reveal as="p" y={10} className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-6">
              Prêt quand vous l’êtes
            </Reveal>

            <TextReveal
              as="h2"
              className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] lg:leading-[1.02] text-background text-balance"
            >
              Modernisez votre établissement{" "}
              <span className="font-display-italic text-gradient-warm">dès aujourd’hui</span>.
            </TextReveal>

            <Reveal as="p" delay={0.15} className="mt-6 text-lg text-background/70 leading-relaxed">
              Rejoignez des centaines de restaurateurs qui ont sauté le pas. Essai gratuit
              14 jours, sans carte de crédit, activé en deux minutes.
            </Reveal>

            <Reveal as="div" delay={0.28} className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Magnetic strength={0.4}>
                <Button asChild size="lg" className="h-14 px-9 text-base font-semibold rounded-full shadow-xl shadow-primary/30">
                  <Link href="/auth/register">
                    Créer mon compte
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </Magnetic>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-9 text-base rounded-full bg-transparent border-background/25 text-background hover:bg-background/10 hover:text-background"
              >
                <Link href="/contact">Demander une démo</Link>
              </Button>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
