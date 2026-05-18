import { LazySection } from "@/components/common/LazySection"
import { Star, Quote } from "lucide-react"

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
      <section className="py-20 sm:py-28 bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 mb-5">
              <Star className="h-3.5 w-3.5 fill-primary" />
              <span className="text-xs font-bold uppercase tracking-widest">Témoignages</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-4">
              Des restaurateurs qui nous font confiance
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Plus de 500 établissements utilisent Flash Menu au quotidien pour piloter leur activité.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-card border border-border rounded-2xl p-7 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <div className="relative flex-1">
                  <Quote className="absolute -top-1 -left-1 h-6 w-6 text-primary/15 rotate-180" />
                  <p className="text-foreground/90 text-sm leading-relaxed pl-5 italic">
                    {t.text}
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {t.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.role}</p>
                    <p className="text-xs text-muted-foreground/70">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof bar */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">+500 restaurants</span>
            <span className="h-1 w-1 rounded-full bg-border hidden sm:block" />
            <span>98 % de satisfaction client</span>
            <span className="h-1 w-1 rounded-full bg-border hidden sm:block" />
            <span>Support 7j/7</span>
            <span className="h-1 w-1 rounded-full bg-border hidden sm:block" />
            <span>Note moyenne ⭐ 4,9 / 5</span>
          </div>

        </div>
      </section>
    </LazySection>
  );
}