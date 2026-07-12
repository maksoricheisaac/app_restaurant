import type { PlanCatalog } from '@/config/plans';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Cache mémoire (session) + déduplication de la requête in-flight. Plusieurs
// composants (pricing, landing, onboarding, billing tenant) demandent le
// catalogue : sans ce partage, chaque montage refaisait un appel réseau et un
// pic de requêtes pouvait déclencher un 429 (« les plans n'apparaissent pas »).
const CATALOG_TTL = 30_000;
let catalogCache: { data: PlanCatalog[]; at: number } | null = null;
let catalogInFlight: Promise<PlanCatalog[]> | null = null;

/**
 * Catalogue public des plans (page Pricing + onboarding). Fetch direct (sans
 * l'intercepteur api-client) pour rester utilisable sur les pages publiques
 * non authentifiées, sans risque de redirection vers /auth/login.
 */
export async function fetchPlanCatalog(force = false): Promise<PlanCatalog[]> {
  if (!force && catalogCache && Date.now() - catalogCache.at < CATALOG_TTL) {
    return catalogCache.data;
  }
  if (!force && catalogInFlight) return catalogInFlight;

  catalogInFlight = (async () => {
    const res = await fetch(`${API}/plans/catalog`, { credentials: 'include' });
    if (!res.ok) throw new Error('Impossible de charger le catalogue des plans');
    const data = (await res.json()) as PlanCatalog[];
    catalogCache = { data, at: Date.now() };
    return data;
  })().finally(() => {
    catalogInFlight = null;
  });

  return catalogInFlight;
}

/** Invalide le cache client du catalogue (ex: après une écriture admin). */
export function invalidatePlanCatalog() {
  catalogCache = null;
}

/** Plan administrable (forme brute de la table Plan) — vue Super Admin. */
export interface AdminPlan {
  id: string;
  key: string;
  name: string;
  tagline: string | null;
  description: string | null;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  maxMenuItems: number;
  maxTables: number;
  maxStaffMembers: number;
  maxMonthlyOrders: number;
  features: Record<string, boolean>;
  highlights: string[];
  badge: string | null;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type PlanWriteInput = Partial<
  Omit<AdminPlan, 'id' | 'createdAt' | 'updatedAt'>
> & { key?: string; name?: string };
