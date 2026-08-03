import { Clock, MapPin, Phone, Mail } from "lucide-react"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "./section-heading"
import type { PublicRestaurant } from "@/types/restaurant"

export interface OpeningHour {
  dayOfWeek:
    | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY"
    | "FRIDAY" | "SATURDAY" | "SUNDAY"
  openTime: string
  closeTime: string
  isClosed: boolean
}

const DAY_LABELS: Record<OpeningHour["dayOfWeek"], string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
}

const DAY_ORDER: OpeningHour["dayOfWeek"][] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
]

/** Horaires d'ouverture et coordonnées — les deux informations qu'un client
 *  vient chercher en premier sur le site d'un restaurant. */
export function VitrineHours({
  restaurant,
  hours,
}: {
  restaurant: PublicRestaurant | null
  hours: OpeningHour[]
}) {
  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]))
  const hasContact =
    restaurant?.address || restaurant?.phone || restaurant?.email

  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Nous trouver"
          title={
            <>
              Horaires et{" "}
              <span className="font-display-italic text-gradient-warm">coordonnées</span>
            </>
          }
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-2 max-w-4xl mx-auto">
          <Reveal y={20}>
            <div className="h-full rounded-2xl border border-border bg-card p-7">
              <h3 className="flex items-center gap-2 font-semibold text-foreground">
                <Clock className="h-4.5 w-4.5 text-primary" />
                Horaires d&apos;ouverture
              </h3>
              <dl className="mt-5 space-y-2.5">
                {DAY_ORDER.map((day) => {
                  const h = byDay.get(day)
                  return (
                    <div
                      key={day}
                      className="flex items-baseline justify-between gap-4 text-sm"
                    >
                      <dt className="text-muted-foreground">{DAY_LABELS[day]}</dt>
                      <dd className="font-medium text-foreground tabular-nums">
                        {!h || h.isClosed ? (
                          <span className="text-muted-foreground">Fermé</span>
                        ) : (
                          `${h.openTime} – ${h.closeTime}`
                        )}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </div>
          </Reveal>

          {hasContact && (
            <Reveal delay={0.1} y={20}>
              <div className="h-full rounded-2xl border border-border bg-card p-7">
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <MapPin className="h-4.5 w-4.5 text-primary" />
                  Nous contacter
                </h3>
                <ul className="mt-5 space-y-4 text-sm">
                  {restaurant?.address && (
                    <li className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{restaurant.address}</span>
                    </li>
                  )}
                  {restaurant?.phone && (
                    <li className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <a
                        href={`tel:${restaurant.phone}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {restaurant.phone}
                      </a>
                    </li>
                  )}
                  {restaurant?.email && (
                    <li className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <a
                        href={`mailto:${restaurant.email}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {restaurant.email}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}
