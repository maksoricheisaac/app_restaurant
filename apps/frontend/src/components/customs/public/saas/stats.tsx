import { Counter } from "@/components/motion/counter"
import { Reveal } from "@/components/motion/reveal"

const STATS = [
  { to: 500, suffix: "+", label: "restaurants actifs", group: true },
  { to: 3, suffix: "×", label: "de commandes en plus", decimals: 0 },
  { to: 98, suffix: " %", label: "de satisfaction client" },
  { to: 2, suffix: " min", label: "pour être opérationnel" },
]

export const SaasStats = () => {
  return (
    <section className="relative py-20 sm:py-24 bg-foreground text-background overflow-hidden">
      {/* Halo chaud sur fond encre */}
      <div className="absolute inset-0 -z-0 opacity-40 [background:radial-gradient(60%_60%_at_50%_120%,oklch(0.645_0.205_44/0.5),transparent_70%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="p" y={10} className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Des résultats concrets
        </Reveal>
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-5xl sm:text-6xl tabular-nums text-background">
                <Counter to={s.to} suffix={s.suffix} decimals={s.decimals ?? 0} group={s.group} />
              </p>
              <p className="mt-3 text-sm text-background/60">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
