import { LazySection } from "@/components/common/LazySection"
import { Star, Quote } from "lucide-react"
import { SectionHeading } from "@/components/customs/public/vitrine/section-heading"
import { Stagger } from "@/components/motion/stagger"

const TESTIMONIALS = [
  {
    name: 'Kofi Agyemang',
    role: 'Propriétaire · Le Palais du Goût',
    location: 'Abidjan, Côte d\'Ivoire',
    text: 'Flash Menu a transformé notre façon de prendre les commandes. On est passé des carnets de notes à un tableau de bord en temps réel. Le KDS en cuisine a divisé nos erreurs par trois en deux semaines.',
    rating: 5,
    initials: 'KA',
  },
  {
    name: 'Amina Diallo',
    role: 'Gérante · Chez Amina Resto',
    location: 'Dakar, Sénégal',
    text: 'L\'onboarding en 2 minutes, c\'est vrai. J\'avais mon QR code fonctionnel avant même de finir mon café. Le support répond en moins d\'une heure et les mises à jour arrivent chaque semaine.',
    rating: 5,
    initials: 'AD',
  },
  {
    name: 'Jean-Claude Mbeki',
    role: 'Directeur · Saveurs d\'Afrique (3 sites)',
    location: 'Douala, Cameroun',
    text: 'Je gère maintenant 3 établissements depuis un seul dashboard. Les rapports consolidés nous ont permis d\'identifier les plats peu rentables et de réduire le gaspillage de 20 % dès le premier mois.',
    rating: 5,
    initials: 'JM',
  },
] as const;

export const Testimonials = () => {
  return (
    <LazySection>
      <section className="py-24 sm:py-32 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <SectionHeading
            eyebrow="Témoignages"
            title={<>Des restaurateurs qui nous <span className="font-display-italic text-gradient-warm">font confiance</span></>}
            description="Plus de 500 établissements pilotent leur activité avec Flash Menu au quotidien."
          />

          {/* Cards */}
          <Stagger className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6" stagger={0.12}>
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="bg-background border border-border rounded-3xl p-8 flex flex-col gap-6 shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-primary/15" />
                </div>

                <blockquote className="flex-1 text-foreground/90 leading-relaxed">
                  “{t.text}”
                </blockquote>

                <figcaption className="flex items-center gap-3 pt-5 border-t border-border">
                  <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0 ring-1 ring-primary/10">
                    {t.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.role}</p>
                    <p className="text-xs text-muted-foreground/70">{t.location}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </Stagger>

          {/* Social proof bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">+500 restaurants</span>
            <span className="h-1 w-1 rounded-full bg-border hidden sm:block" />
            <span>98 % de satisfaction</span>
            <span className="h-1 w-1 rounded-full bg-border hidden sm:block" />
            <span>Support 7j/7</span>
            <span className="h-1 w-1 rounded-full bg-border hidden sm:block" />
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              4,9 / 5 de note moyenne
            </span>
          </div>

        </div>
      </section>
    </LazySection>
  );
}
