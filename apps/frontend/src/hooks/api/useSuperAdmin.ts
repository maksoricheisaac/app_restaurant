import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';

// ─── Tenants ─────────────────────────────────────────────────────────────────

export const useTenantDetail = (id: string | null) =>
  useQuery({
    queryKey: ['tenant-detail', id],
    queryFn: () => api.get(`/tenants/${id}`),
    enabled: !!id,
  });

export const useCreateTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string; plan: string }) =>
      api.post('/tenants', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
};

export const useUpdateTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/tenants/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const useUpdateUserRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, platformRole }: { id: string; platformRole: string }) =>
      api.patch(`/auth/users/${id}/role`, { platformRole }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-all-users'] }),
  });
};

export const useUpdateUserStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/auth/users/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-all-users'] }),
  });
};
