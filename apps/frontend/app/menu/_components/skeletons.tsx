import { WARM } from '../_lib/theme';

// Bloc gris animé (shimmer) réutilisable.
function Bar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{ backgroundColor: WARM.surfaceAlt }}
    />
  );
}

/** Skeleton de la page menu / commande (hero + cartes). */
export function MenuSkeleton() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: WARM.page }}>
      <div className="h-56 w-full animate-pulse" style={{ backgroundColor: WARM.surfaceAlt }} />
      <div className="mx-auto max-w-2xl px-4">
        <div className="flex gap-2 py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bar key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 pb-10 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-3xl"
              style={{ backgroundColor: WARM.card, border: `1px solid ${WARM.border}` }}
            >
              <Bar className="h-40 w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Bar className="h-4 w-2/3" />
                <Bar className="h-3 w-full" />
                <Bar className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton du suivi de commande (hero statut + timeline + récap). */
export function TrackSkeleton() {
  return (
    // <main> dès le chargement : le repère principal ne doit pas apparaître
    // seulement une fois les données arrivées.
    <main
      className="min-h-screen"
      style={{ backgroundColor: WARM.page }}
      aria-busy="true"
    >
      {/* Annonce le chargement aux lecteurs d'écran : sans ce texte, la page
          n'expose qu'un bloc visuel muet pendant toute l'attente. */}
      <span className="sr-only">Chargement du suivi de commande…</span>
      <div className="h-16 w-full animate-pulse" style={{ backgroundColor: WARM.card }} />
      <div className="mx-auto max-w-md space-y-4 px-4 py-6">
        <Bar className="h-24 w-full rounded-3xl" />
        <div
          className="space-y-5 rounded-3xl p-5"
          style={{ backgroundColor: WARM.card, border: `1px solid ${WARM.border}` }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Bar className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2 pt-1">
                <Bar className="h-3 w-1/3" />
                <Bar className="h-2.5 w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <Bar className="h-40 w-full rounded-3xl" />
      </div>
    </main>
  );
}
