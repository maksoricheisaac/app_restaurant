import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion/reveal';
import { TextReveal } from '@/components/motion/text-reveal';

export type LegalSection = {
  heading: string;
  body: ReactNode;
};

type LegalDocProps = {
  eyebrow: string;
  title: ReactNode;
  updatedAt: string;
  intro?: ReactNode;
  sections: LegalSection[];
};

/**
 * Gabarit éditorial pour les pages légales (mentions, confidentialité, CGU).
 * Titrage serif, sommaire ancré, typographie lisible (mesure ~65 caractères).
 */
export function LegalDoc({ eyebrow, title, updatedAt, intro, sections }: LegalDocProps) {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-12">
        <div className="warm-aura absolute inset-0 -z-10" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Reveal as="div" y={12} className="inline-flex items-center gap-2.5 mb-5">
            <span className="h-px w-8 bg-primary/60" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</span>
          </Reveal>
          <TextReveal as="h1" className="font-display text-4xl sm:text-5xl text-foreground text-balance">
            {title}
          </TextReveal>
          <Reveal as="p" delay={0.12} className="mt-4 text-sm text-muted-foreground">
            Dernière mise à jour : {updatedAt}
          </Reveal>
          {intro && (
            <Reveal as="p" delay={0.16} className="mt-6 text-lg text-muted-foreground leading-relaxed">
              {intro}
            </Reveal>
          )}
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28 grid lg:grid-cols-[1fr] gap-12">
        {/* Sommaire */}
        <nav aria-label="Sommaire" className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Sommaire</p>
          <ol className="space-y-1.5">
            {sections.map((s, i) => (
              <li key={s.heading}>
                <a href={`#section-${i + 1}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  <span className="font-display text-primary/70 mr-2">{String(i + 1).padStart(2, '0')}</span>
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Corps */}
        <article className="space-y-10">
          {sections.map((s, i) => (
            <section key={s.heading} id={`section-${i + 1}`} className="scroll-mt-24">
              <Reveal y={20}>
                <h2 className="font-display text-2xl text-foreground mb-3 flex items-baseline gap-3">
                  <span className="text-base text-primary/70">{String(i + 1).padStart(2, '0')}</span>
                  {s.heading}
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-3 [&_a]:text-primary [&_a]:underline [&_strong]:text-foreground">
                  {s.body}
                </div>
              </Reveal>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
