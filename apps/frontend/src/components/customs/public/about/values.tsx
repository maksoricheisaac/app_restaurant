import { Zap, ShieldCheck, HeartHandshake, Sparkles } from "lucide-react"
import { SectionHeading } from "@/components/customs/public/saas/section-heading"
import { Stagger } from "@/components/motion/stagger"

const VALUES = [
  {
    icon: Sparkles,
    title: "La simplicité d’abord",
    description:
      "Chaque écran doit s’expliquer tout seul. Si une fonctionnalité a besoin d’un manuel, c’est qu’elle est mal conçue.",
  },
  {
    icon: Zap,
    title: "Le temps réel, vraiment",
    description:
      "Une commande, un paiement, une table qui se libère : tout se propage instantanément. Zéro double saisie, zéro décalage.",
  },
  {
    icon: ShieldCheck,
    title: "Vos données, à vous",
    description:
      "Isolation stricte entre établissements, chiffrement, hébergement européen, conformité RGPD. La confiance se gagne dans les détails.",
  },
  {
    icon: HeartHandshake,
    title: "Proches de nos clients",
    description:
      "Un support humain qui connaît le métier, des mises à jour chaque semaine, et une feuille de route dictée par vos retours.",
  },
]

export const AboutValues = () => {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Nos valeurs"
          title={<>Ce qui guide <span className="font-display-italic text-gradient-warm">chaque décision</span></>}
          description="Quatre principes que nous ne négocions pas, du premier prototype à chaque nouvelle fonctionnalité."
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
