/**
 * Types & constantes des plans.
 *
 * Les VALEURS des plans (prix, limites, features) ne vivent plus ici : elles
 * sont pilotées par les données dans la table `Plan` et administrées depuis le
 * Super Admin. Ce fichier ne conserve que les types partagés, les sentinelles
 * et un repli défensif utilisé lorsqu'un plan est introuvable en base.
 */

/** Ensemble extensible de fonctionnalités. De nouvelles clés peuvent être
 *  ajoutées sans migration : elles sont stockées dans `Plan.features` (JSON). */
export interface PlanFeatures {
  kds: boolean;
  advancedReports: boolean;
  apiAccess: boolean;
  multiSite: boolean;
  customBranding: boolean;
  [key: string]: boolean;
}

export interface PlanLimits {
  maxMenuItems: number;
  maxTables: number;
  maxStaffMembers: number;
  maxMonthlyOrders: number;
  features: PlanFeatures;
}

/** Sentinelle applicative « illimité » (sérialisable en JSON, contrairement à Infinity). */
export const UNLIMITED = Number.MAX_SAFE_INTEGER;

/** Sentinelle stockée en base pour « illimité » (colonnes Int de `Plan`). */
export const DB_UNLIMITED = -1;

/** Features connues → toutes désactivées par défaut (base de merge). */
export const DEFAULT_FEATURES: PlanFeatures = {
  kds: false,
  advancedReports: false,
  apiAccess: false,
  multiSite: false,
  customBranding: false,
};

/**
 * Repli lorsqu'un plan est introuvable en base (plan supprimé encore référencé,
 * clé inconnue, ou base indisponible). Volontairement le plus restrictif
 * possible : on ne doit jamais accorder plus que le plan gratuit par défaut.
 */
export const FALLBACK_LIMITS: PlanLimits = {
  maxMenuItems: 5,
  maxTables: 3,
  maxStaffMembers: 2,
  maxMonthlyOrders: 10,
  features: { ...DEFAULT_FEATURES },
};

/** Convertit une valeur de limite stockée (-1 = illimité) en sentinelle applicative. */
export function fromDbLimit(value: number): number {
  return value < 0 ? UNLIMITED : value;
}
