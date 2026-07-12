/**
 * Types & helpers d'affichage des plans.
 *
 * Les VALEURS des plans (prix, limites, features) ne sont plus codées ici :
 * elles sont pilotées par les données et servies par l'API `/plans/catalog`
 * (administrées depuis le Super Admin). Ce fichier ne conserve que les types
 * partagés et des helpers de formatage réutilisés par le front.
 *
 * → Récupérer le catalogue : `usePlanCatalog()` (src/hooks/api/usePlans.ts).
 */

/** Clé de plan (Plan.key côté backend). Plus une union figée. */
export type PlanKey = string;
/** Alias rétro-compatible. */
export type PlanId = PlanKey;

export interface PlanCatalogLimits {
  /** -1 = illimité. */
  maxMenuItems: number;
  maxTables: number;
  maxStaffMembers: number;
  maxMonthlyOrders: number;
}

/** Plan tel que renvoyé par `/plans/catalog` (forme normalisée). */
export interface PlanCatalog {
  key: PlanKey;
  name: string;
  tagline: string | null;
  description: string | null;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  limits: PlanCatalogLimits;
  features: Record<string, boolean>;
  highlights: string[];
  badge: string | null;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  /** Visible mais non souscriptible (« Bientôt disponible »). */
  comingSoon: boolean;
}

/** Libellés lisibles des features connues (pour comparatifs / affichage). */
export const FEATURE_LABELS: Record<string, string> = {
  kds: 'Kitchen Display System',
  advancedReports: 'Rapports avancés',
  apiAccess: 'API & intégrations',
  multiSite: 'Multi-établissements',
  customBranding: 'Personnalisation de marque',
};

/** Symbole d'une devise ISO (fallback : le code lui-même). */
export function currencySymbol(currency: string): string {
  const map: Record<string, string> = {
    EUR: '€',
    USD: '$',
    CHF: 'CHF',
    CAD: 'CA$',
    MAD: 'MAD',
    TND: 'TND',
    DZD: 'DZD',
    XOF: 'CFA',
  };
  return map[currency] ?? currency;
}

/** Prix mensuel formaté (« Gratuit » si 0). */
export function formatPrice(plan: Pick<PlanCatalog, 'monthlyPrice' | 'currency'>): string {
  if (plan.monthlyPrice <= 0) return 'Gratuit';
  return `${plan.monthlyPrice} ${currencySymbol(plan.currency)}`;
}

/** Valeur de limite lisible (-1 → « Illimité »). */
export function formatLimit(value: number): string {
  return value < 0 ? 'Illimité' : String(value);
}

export function isUnlimited(value: number): boolean {
  return value < 0;
}
