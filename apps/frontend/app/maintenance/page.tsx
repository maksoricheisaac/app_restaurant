import type { Metadata } from 'next';
import Link from 'next/link';
import { ChefHat, Wrench, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Maintenance en cours — Flash Menu',
  description: 'Flash Menu est momentanément en maintenance. Nous revenons très vite.',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="min-h-dvh relative flex flex-col items-center justify-center px-6 py-16 text-center overflow-hidden bg-background">
      <div className="warm-aura absolute inset-0 -z-10" />

      <Link href="/" className="inline-flex items-center gap-2.5 mb-10">
        <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm">
          <ChefHat className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <span className="font-display text-lg text-foreground">Flash Menu</span>
      </Link>

      <div className="relative mb-7">
        <div className="h-16 w-16 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center">
          <Wrench className="h-8 w-8 text-primary" strokeWidth={1.6} />
        </div>
        <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-warning border-2 border-background animate-pulse" />
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-4">
        Petite pause technique
      </p>
      <h1 className="font-display text-4xl sm:text-5xl text-foreground text-balance mb-4 max-w-2xl">
        On peaufine quelques{' '}
        <span className="font-display-italic text-gradient-warm">détails en cuisine</span>
      </h1>
      <p className="text-muted-foreground max-w-md leading-relaxed mb-8">
        Flash Menu est momentanément en maintenance pour vous offrir une expérience encore
        plus fluide. Le service reprend très bientôt — merci de votre patience.
      </p>

      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4 text-primary" />
        Retour estimé sous peu
      </div>

      <p className="text-sm text-muted-foreground mt-10">
        Une urgence ?{' '}
        <a href="mailto:hello@flashmenu.app" className="text-primary font-semibold hover:underline">
          hello@flashmenu.app
        </a>
      </p>
    </div>
  );
}
