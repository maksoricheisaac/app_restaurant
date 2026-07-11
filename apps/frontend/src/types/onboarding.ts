/**
 * Données accumulées par le wizard d'inscription (état client uniquement).
 *
 * Rien n'est persisté en base pendant l'assistant : ces champs vivent dans le
 * state React (+ un brouillon localStorage pour la reprise) jusqu'à la
 * finalisation, qui envoie l'ensemble — compte inclus — à
 * `POST /onboarding/register` en une transaction unique. Tant que le wizard
 * n'est pas terminé, AUCUNE donnée (le compte compris) n'existe en base.
 *
 * Le `plan` reste purement côté client : le tenant est toujours créé sur `free`.
 * Un plan payant déclenche, après inscription, un checkout `/billing/*`
 * (upgrade appliqué par webhook).
 */
export interface OnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  restaurantName: string;
  slug: string;
  country: string;
  currency: string;
  timezone: string;
  cuisineType?: string;
  plan: 'free' | 'pro' | 'enterprise';
}

/** Payload d'inscription envoyé au backend (compte + restaurant, sans le plan). */
export type RegisterPayload = Pick<
  OnboardingData,
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'password'
  | 'restaurantName'
  | 'slug'
  | 'country'
  | 'currency'
  | 'timezone'
  | 'cuisineType'
>;
