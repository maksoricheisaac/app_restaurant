import { useEffect, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import type { PlanCatalog } from '@/config/plans';
import {
  fetchPlanCatalog,
  invalidatePlanCatalog,
  type AdminPlan,
  type PlanWriteInput,
} from '@/services/plans.service';

/**
 * Catalogue public des plans. Hook autonome (useState/useEffect) plutôt que
 * react-query : utilisable partout, y compris sur les pages publiques et
 * l'onboarding qui ne montent pas nécessairement un QueryClientProvider.
 */
export function usePlanCatalog() {
  const [plans, setPlans] = useState<PlanCatalog[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await fetchPlanCatalog();
      setPlans(data);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchPlanCatalog()
      .then((d) => mounted && setPlans(d))
      .catch(() => mounted && setIsError(true))
      .finally(() => mounted && setIsLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return { plans, isLoading, isError, reload: load };
}

// ─── Super Admin CRUD (react-query — zone admin authentifiée) ───────────────

export const useAdminPlans = () =>
  useQuery<AdminPlan[]>({
    queryKey: ['admin-plans'],
    queryFn: () => api.get('/admin/plans'),
    staleTime: 30_000,
  });

// Après une écriture admin, on invalide AUSSI le cache client du catalogue
// public pour que les pages Pricing / onboarding reflètent le changement.
const onPlanWriteSuccess = (qc: ReturnType<typeof useQueryClient>) => {
  invalidatePlanCatalog();
  qc.invalidateQueries({ queryKey: ['admin-plans'] });
  qc.invalidateQueries({ queryKey: ['billing-stats'] });
};

export const useCreatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PlanWriteInput) => api.post('/admin/plans', data),
    onSuccess: () => onPlanWriteSuccess(qc),
  });
};

export const useUpdatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PlanWriteInput }) =>
      api.patch(`/admin/plans/${id}`, data),
    onSuccess: () => onPlanWriteSuccess(qc),
  });
};

export const useSetPlanActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/plans/${id}/active`, { isActive }),
    onSuccess: () => onPlanWriteSuccess(qc),
  });
};

export const useDeletePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/plans/${id}`),
    onSuccess: () => onPlanWriteSuccess(qc),
  });
};
