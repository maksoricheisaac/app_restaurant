import { SectionHeading } from "@/components/customs/public/saas/section-heading"
import { Stagger } from "@/components/motion/stagger"
import { Linkedin } from "lucide-react"

const TEAM = [
  {
    initials: "SM",
    name: "Sarah Mensah",
    role: "CEO & cofondatrice",
    bio: "Ancienne cheffe de rang devenue product manager. Garante de l’obsession client.",
  },
  {
    initials: "TL",
    name: "Thomas Lefebvre",
    role: "CTO & cofondateur",
    bio: "Architecte temps réel. Il dort mal quand une commande met plus d’une seconde à s’afficher.",
  },
  {
    initials: "AK",
    name: "Aïcha Koné",
    role: "Head of Design",
    bio: "Elle traque le clic superflu. Chaque écran passe par son œil avant vous.",
  },
  {
    initials: "MB",
    name: "Marc Bianchi",
    role: "Head of Customer Success",
    bio: "Il a fait le service dans 40 restaurants clients. Votre voix à l’intérieur de Flash Menu.",
  },
]

export const AboutTeam = () => {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="L’équipe"
          title={<>Des gens qui ont <span className="font-display-italic text-gradient-warm">fait le service</span></>}
          description="Une petite équipe qui connaît le rush du vendredi soir aussi bien que le code qui tourne derrière."
        />

        <Stagger className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.1}>
          {TEAM.map((m) => (
            <div
              key={m.name}
              className="group bg-card border border-border rounded-3xl p-7 text-center hover:shadow-lg transition-shadow duration-300"
            >
              <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/10 mb-5">
                <span className="font-display text-2xl">{m.initials}</span>
              </div>
              <h3 className="text-base font-semibold text-foreground">{m.name}</h3>
              <p className="text-sm text-primary font-medium mb-3">{m.role}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{m.bio}</p>
              <span className="mt-4 inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                <Linkedin className="h-4 w-4" />
              </span>
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
