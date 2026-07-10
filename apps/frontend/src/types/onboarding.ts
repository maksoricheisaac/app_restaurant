/**
 * Données accumulées par le wizard d'onboarding (état client uniquement).
 *
 * Rien n'est persisté en base pendant l'assistant : ces champs vivent dans le
 * state React (+ un brouillon localStorage pour la reprise) jusqu'à l'étape de
 * finalisation, qui envoie l'ensemble à `POST /onboarding/complete`.
 *
 * Le « type de compte » n'existe plus : tout utilisateur qui termine
 * l'onboarding crée un restaurant et devient OWNER. Le multi-restaurants
 * relèvera du plan (feature `multiSite`), pas d'un type figé à l'inscription.
 */
export interface OnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  restaurantName: string;
  slug: string;
  country: string;
  currency: string;
  timezone: string;
  cuisineType?: string;
  plan: 'free' | 'pro' | 'enterprise';
}

/** Payload envoyé à la finalisation (sous-ensemble « restaurant » de OnboardingData). */
export type CompleteOnboardingPayload = Pick<
  OnboardingData,
  | 'restaurantName'
  | 'slug'
  | 'country'
  | 'currency'
  | 'timezone'
  | 'cuisineType'
  | 'plan'
>;
