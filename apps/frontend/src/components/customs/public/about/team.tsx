import { SectionHeading } from "@/components/customs/public/vitrine/section-heading"
import { Stagger } from "@/components/motion/stagger"

/** ⚠️ Contenu à personnaliser par le restaurant. */
const TEAM = [
  {
    initials: "CH",
    name: "Le chef",
    role: "Cuisine",
    bio: "Il compose la carte au rythme des arrivages et goûte chaque préparation avant le service.",
  },
  {
    initials: "SC",
    name: "Le second",
    role: "Cuisine",
    bio: "Il tient la ligne pendant le coup de feu et veille à ce que chaque assiette parte comme il faut.",
  },
  {
    initials: "SA",
    name: "La salle",
    role: "Service",
    bio: "Elle vous installe, vous conseille, et connaît la carte aussi bien que la cuisine.",
  },
  {
    initials: "AC",
    name: "L'accueil",
    role: "Réservations",
    bio: "Réservations, groupes, événements : c'est votre interlocuteur avant même votre arrivée.",
  },
]

export const AboutTeam = () => {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="L’équipe"
          title={<>Celles et ceux qui vous <span className="font-display-italic text-gradient-warm">accueillent</span></>}
          description="Une équipe restreinte, qui se connaît, et qui tient la même exigence du matin au dernier service."
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
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
