import Link from "next/link"
import { UtensilsCrossed, ShoppingBag, Bike, CalendarCheck } from "lucide-react"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "./section-heading"
import type { PublicRestaurant } from "@/types/restaurant"

type Service = {
  icon: typeof UtensilsCrossed
  title: string
  description: string
  href: string
  cta: string
}

/**
 * Ce que le restaurant propose réellement. Les modes de service désactivés
 * dans l'administration disparaissent d'ici : le site vitrine ne promet
 * jamais ce que la cuisine ne fait pas.
 */
export function VitrineServices({ restaurant }: { restaurant: PublicRestaurant | null }) {
  const services: Service[] = [
    restaurant?.dineInEnabled !== false && {
      icon: UtensilsCrossed,
      title: "Sur place",
      description:
        "Installez-vous, scannez le QR code de votre table et commandez sans attendre.",
      href: "/menu",
      cta: "Voir la carte",
    },
    restaurant?.takeawayEnabled !== false && {
      icon: ShoppingBag,
      title: "À emporter",
      description:
        "Commandez en ligne, passez récupérer au comptoir à l'heure qui vous arrange.",
      href: "/menu/order",
      cta: "Commander en ligne",
    },
    restaurant?.deliveryEnabled === true && {
      icon: Bike,
      title: "Livraison",
      description:
        "Nous livrons dans les zones desservies, avec un suivi en temps réel de votre commande.",
      href: "/menu/order",
      cta: "Se faire livrer",
    },
    {
      icon: CalendarCheck,
      title: "Réservation",
      description:
        "Réservez votre table en quelques secondes, nous confirmons par email.",
      href: "/menu/reservation",
      cta: "Réserver une table",
    },
  ].filter(Boolean) as Service[]

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Nos services"
          title={
            <>
              Comment souhaitez-vous{" "}
              <span className="font-display-italic text-gradient-warm">nous rejoindre</span> ?
            </>
          }
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => (
            <Reveal key={service.title} delay={i * 0.08} y={20}>
              <Link
                href={service.href}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <service.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-semibold text-lg text-foreground">
                  {service.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <span className="mt-5 text-sm font-semibold text-primary group-hover:underline">
                  {service.cta} →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
