import { Button } from "@/components/ui/button"
import { ArrowRight, MapPin, Phone, UtensilsCrossed } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Reveal } from "@/components/motion/reveal"
import { TextReveal } from "@/components/motion/text-reveal"
import { Magnetic } from "@/components/motion/magnetic"
import type { PublicRestaurant } from "@/types/restaurant"

/**
 * Ouverture du site vitrine : l'identité du restaurant, puis les deux gestes
 * que le visiteur vient faire — voir la carte, réserver une table.
 */
export const VitrineHero = ({ restaurant }: { restaurant: PublicRestaurant | null }) => {
  const name = restaurant?.name ?? "Notre restaurant"

  return (
    <section className="relative overflow-hidden">
      <div className="warm-aura absolute inset-0 -z-10" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px rule-warm" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          <div className="lg:col-span-6">
            <Reveal as="div" y={14} className="inline-flex items-center gap-2.5 mb-7">
              <span className="h-px w-8 bg-primary/60" />
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <UtensilsCrossed className="h-3.5 w-3.5" />
                {restaurant?.cuisineType ?? "Cuisine de saison"}
              </span>
            </Reveal>

            <TextReveal
              as="h1"
              className="font-display text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[4.25rem] lg:leading-[0.98] text-foreground text-balance"
            >
              {name}
            </TextReveal>

            {restaurant?.slogan && (
              <Reveal
                as="p"
                delay={0.1}
                className="mt-4 font-display-italic text-2xl text-gradient-warm"
              >
                {restaurant.slogan}
              </Reveal>
            )}

            <Reveal
              as="p"
              delay={0.15}
              className="mt-6 max-w-xl text-lg sm:text-xl text-muted-foreground leading-relaxed"
            >
              {restaurant?.description ??
                "Une cuisine sincère, des produits choisis, et une équipe qui prend le temps de bien faire. Découvrez la carte du jour et réservez votre table."}
            </Reveal>

            <Reveal as="div" delay={0.28} className="mt-9 flex flex-col sm:flex-row gap-3">
              <Magnetic strength={0.4}>
                <Button
                  asChild
                  size="lg"
                  className="h-14 px-8 text-base font-semibold rounded-full shadow-lg shadow-primary/20"
                >
                  <Link href="/menu">
                    Découvrir notre menu
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
                <Link href="/menu/reservation">Réserver une table</Link>
              </Button>
            </Reveal>

            {(restaurant?.address || restaurant?.phone) && (
              <Reveal as="div" delay={0.38} className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
                {restaurant.address && (
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    {restaurant.address}
                  </span>
                )}
                {restaurant.phone && (
                  <a
                    href={`tel:${restaurant.phone}`}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4 text-primary" />
                    {restaurant.phone}
                  </a>
                )}
              </Reveal>
            )}
          </div>

          <div className="lg:col-span-6">
            <Reveal as="div" delay={0.2} y={24}>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-muted shadow-2xl shadow-primary/10">
                {restaurant?.bannerUrl ? (
                  <Image
                    src={restaurant.bannerUrl}
                    alt={name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-transparent to-primary/5">
                    <UtensilsCrossed className="h-20 w-20 text-primary/30" />
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
