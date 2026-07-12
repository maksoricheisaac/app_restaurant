import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';

export interface UsageEntry {
  current: number;
  /** null = illimité. */
  max: number | null;
}

export interface PlanUsage {
  plan: string;
  usage: {
    menuItems: UsageEntry;
    tables: UsageEntry;
    staff: UsageEntry;
    monthlyOrders: UsageEntry;
  };
  features: Record<string, boolean>;
}

/**
 * Usage réel + entitlements (limites & features) du plan du tenant courant.
 * Source de vérité côté front pour gater les modules/actions selon le plan
 * (data-driven — reflète immédiatement toute modif faite dans le Super Admin).
 */
export const usePlanUsage = (options?: { enabled?: boolean }) =>
  useQuery<PlanUsage>({
    queryKey: ['plan-usage'],
    queryFn: () => api.get('/plans/usage'),
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });

/** True si la feature est incluse dans le plan du tenant. `isLoading` tant qu'on ne sait pas. */
export function useFeature(key: string): { enabled: boolean; isLoading: boolean } {
  const { data, isLoading } = usePlanUsage();
  return { enabled: !!data?.features?.[key], isLoading };
}
