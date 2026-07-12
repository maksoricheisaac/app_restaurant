'use client';

import Link from 'next/link';
import { ChefHat, RotateCcw, ArrowRight, AlertTriangle, Compass, ServerCrash } from 'lucide-react';

// On mappe un NOM d'icône (chaîne) plutôt qu'un composant : une fonction ne peut
// pas franchir la frontière Server → Client (la 404 est un Server Component).
const ICONS = {
  alert: AlertTriangle,
  compass: Compass,
  server: ServerCrash,
} as const;

type ErrorStateProps = {
  icon: keyof typeof ICONS;
  /** Grand libellé serif (ex : « 404 » ou « Oups »). */
  code?: string;
  title: string;
  message: string;
  onRetry?: () => void;
  primaryHref?: string;
  primaryLabel?: string;
  /** min-h-screen (page pleine) ou min-h-[60vh] (dans un layout avec header/footer). */
  full?: boolean;
};

/**
 * Écran d'état (erreur / introuvable / maintenance) en Warm Editorial. Partagé
 * par les error boundaries et la 404 pour une expérience cohérente et rassurante.
 */
export function ErrorState({
  icon,
  code,
  title,
  message,
  onRetry,
  primaryHref = '/',
  primaryLabel = "Retour à l’accueil",
  full = true,
}: ErrorStateProps) {
  const Icon = ICONS[icon];
  return (
    <div className={`${full ? 'min-h-dvh' : 'min-h-[60vh]'} relative flex flex-col items-center justify-center px-6 py-16 text-center overflow-hidden bg-background`}>
      <div className="warm-aura absolute inset-0 -z-10" />

      <Link href="/" className="inline-flex items-center gap-2.5 mb-10">
        <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm">
          <ChefHat className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <span className="font-display text-lg text-foreground">Flash Menu</span>
      </Link>

      {code && (
        <p className="font-display text-7xl sm:text-8xl text-gradient-warm leading-none mb-4">{code}</p>
      )}

      <div className="h-14 w-14 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center mb-6">
        <Icon className="h-7 w-7 text-primary" strokeWidth={1.6} />
      </div>

      <h1 className="font-display text-3xl sm:text-4xl text-foreground text-balance mb-3">{title}</h1>
      <p className="text-muted-foreground max-w-md leading-relaxed mb-8">{message}</p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Réessayer
          </button>
        )}
        <Link
          href={primaryHref}
          className={`inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full text-sm font-semibold transition-colors ${
            onRetry
              ? 'border border-border text-foreground hover:bg-accent'
              : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90'
          }`}
        >
          {primaryLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
