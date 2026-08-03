import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { TextReveal } from "@/components/motion/text-reveal"
import { Magnetic } from "@/components/motion/magnetic"
import type { PublicRestaurant } from "@/types/restaurant"

/** Dernier appel : réserver, ou commander tout de suite. */
export function VitrineCTA({ restaurant }: { restaurant: PublicRestaurant | null }) {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="warm-aura absolute inset-0 -z-10" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <TextReveal
          as="h2"
          className="font-display text-3xl sm:text-4xl lg:text-[2.85rem] lg:leading-[1.05] text-foreground text-balance"
        >
          Une table vous attend{" "}
          <span className="font-display-italic text-gradient-warm">
            {restaurant?.name ? `chez ${restaurant.name}` : "chez nous"}
          </span>
        </TextReveal>

        <Reveal as="p" delay={0.12} className="mt-5 text-lg text-muted-foreground">
          Réservez en quelques secondes, ou commandez dès maintenant sans créer de
          compte.
        </Reveal>

        <Reveal as="div" delay={0.24} className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <Magnetic strength={0.4}>
            <Button
              asChild
              size="lg"
              className="h-14 px-8 text-base font-semibold rounded-full shadow-lg shadow-primary/20"
            >
              <Link href="/menu/reservation">
                Réserver une table
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </Magnetic>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 px-8 text-base rounded-full"
          >
            <Link href="/menu">Commander en ligne</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
