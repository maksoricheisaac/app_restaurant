import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChefHat, ChevronLeft, Star } from 'lucide-react';

type AuthShellProps = {
  children: ReactNode;
  /** Accroche serif du panneau marque (gauche, desktop). */
  panelTitle: ReactNode;
  panelPoints?: string[];
  /** Lien retour affiché en haut du panneau formulaire. */
  backHref?: string;
  backLabel?: string;
};

const DEFAULT_POINTS = [
  'Menu QR, commandes et cuisine synchronisés en temps réel',
  'Caisse, réservations et rapports dans une seule interface',
  'Activé en 2 minutes, sans matériel ni informaticien',
];

/**
 * Ossature partagée des pages d'authentification (login + secondaires) :
 * split-screen premium avec panneau marque éditorial à gauche (desktop) et zone
 * de contenu/formulaire à droite. Garantit une expérience cohérente et chaleureuse.
 */
export function AuthShell({
  children,
  panelTitle,
  panelPoints = DEFAULT_POINTS,
  backHref = '/',
  backLabel = "Retour à l’accueil",
}: AuthShellProps) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2 bg-background">
      {/* Panneau marque */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-foreground text-background p-12 xl:p-16">
        <div className="absolute inset-0 opacity-60 [background:radial-gradient(50%_50%_at_20%_0%,oklch(0.645_0.205_44/0.35),transparent_70%),radial-gradient(40%_50%_at_90%_100%,oklch(0.8_0.15_78/0.25),transparent_70%)]" />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow group-hover:-rotate-3 transition-transform">
              <ChefHat className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <span className="font-display text-xl">Flash Menu</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl xl:text-5xl leading-[1.05] text-balance">{panelTitle}</h2>
          <ul className="mt-8 space-y-3.5">
            {panelPoints.map((p) => (
              <li key={p} className="flex items-start gap-3 text-background/75">
                <span className="mt-1 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <span className="text-sm leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-4">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-warning text-warning" />
            ))}
          </div>
          <p className="text-sm text-background/60">
            <span className="text-background font-medium">4,9 / 5</span> · +500 restaurants
          </p>
        </div>
      </aside>

      {/* Panneau contenu */}
      <main className="flex flex-col justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md mx-auto animate-slide-up">
          <Link href={backHref} className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <div className="lg:hidden flex w-fit items-center gap-2.5 mb-6">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow">
              <ChefHat className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <span className="font-display text-xl text-foreground">Flash Menu</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
