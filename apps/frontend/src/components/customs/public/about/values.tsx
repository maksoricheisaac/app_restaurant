import { Leaf, ChefHat, HeartHandshake, Clock } from "lucide-react"
import { SectionHeading } from "@/components/customs/public/vitrine/section-heading"
import { Stagger } from "@/components/motion/stagger"

/** ⚠️ Contenu à personnaliser par le restaurant. */
const VALUES = [
  {
    icon: Leaf,
    title: "Des produits choisis",
    description:
      "Nous travaillons avec des producteurs que nous connaissons, et la carte suit les saisons plutôt que l'inverse.",
  },
  {
    icon: ChefHat,
    title: "Fait maison",
    description:
      "Les préparations sont réalisées sur place, chaque jour. Ce qui ne peut pas l'être ne figure pas sur la carte.",
  },
  {
    icon: HeartHandshake,
    title: "L'accueil avant tout",
    description:
      "Une table, ce n'est pas qu'une assiette. On prend le temps de vous installer, de conseiller, de revenir vers vous.",
  },
  {
    icon: Clock,
    title: "Le respect du temps",
    description:
      "Le vôtre comme celui de la cuisine : commande en ligne, suivi en direct, et pas d'attente inutile en salle.",
  },
]

export const AboutValues = () => {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Nos engagements"
          title={<>Ce qui ne change <span className="font-display-italic text-gradient-warm">jamais</span></>}
          description="Quatre principes qui tiennent, du choix des producteurs au dernier service."
        />

        <Stagger className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="group bg-card border border-border rounded-3xl p-7 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/10 mb-5 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                <v.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
