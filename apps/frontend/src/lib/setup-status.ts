/**
 * État d'installation du logiciel, côté serveur Next.
 *
 * Interrogé par le middleware (`proxy.ts`) sur chaque navigation, et par les
 * rendus serveur de `/setup` et `/admin`. Deux propriétés rendent cela peu
 * coûteux :
 *
 * - l'état est **monotone** — un logiciel installé ne redevient jamais « à
 *   installer » — donc une fois `false` constaté, plus aucun appel n'est émis ;
 * - tant qu'il est `true`, les appels sont espacés par un TTL court : la phase
 *   d'installation dure quelques minutes dans la vie d'un déploiement.
 *
 * Ce module ne dépend que de `fetch` : il doit rester exécutable sur le runtime
 * Edge du middleware comme sur le runtime Node des composants serveur.
 */

export interface SetupStatus {
  setupRequired: boolean;
  restaurantName: string | null;
  /**
   * L'établissement est configuré, mais son compte super administrateur a
   * disparu. L'assistant se rouvre alors pour ce seul compte, sans toucher à
   * la configuration existante.
   */
  recovery: boolean;
}

const API_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000/api/v1';

/** Durée de mise en cache d'un état « installation requise ». */
const PENDING_TTL_MS = 5_000;

let installed = false;
let lastCheck = 0;
let cached: SetupStatus | null = null;

/**
 * Renvoie l'état d'installation, ou `null` si le backend est injoignable.
 *
 * `null` — et non « installation requise » — est délibéré : une API en panne ne
 * doit pas envoyer tous les visiteurs vers l'assistant d'installation. Les
 * appelants traitent `null` en laissant passer la navigation.
 */
export async function getSetupStatus(): Promise<SetupStatus | null> {
  if (installed) return cached;

  const now = Date.now();
  if (cached && now - lastCheck < PENDING_TTL_MS) return cached;

  try {
    const response = await fetch(`${API_BASE}/setup/status`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return null;

    const body = (await response.json()) as Partial<SetupStatus> & {
      required?: boolean;
    };
    // `required` : ancien nom du champ, encore renvoyé par le backend.
    const setupRequired = body.setupRequired ?? body.required ?? false;

    cached = {
      setupRequired,
      restaurantName: body.restaurantName ?? null,
      recovery: body.recovery ?? false,
    };
    lastCheck = now;
    if (!setupRequired) installed = true;

    return cached;
  } catch {
    return null;
  }
}

/** Réinitialise le cache. Réservé aux tests. */
export function resetSetupStatusCache(): void {
  installed = false;
  lastCheck = 0;
  cached = null;
}
