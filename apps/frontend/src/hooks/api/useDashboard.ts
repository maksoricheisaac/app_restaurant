import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';

export const useDashboardStats = (params?: { date?: string }) => {
  return useQuery({
    queryKey: ['dashboard-stats', params],
    queryFn: () => dashboardService.getStats(params),
    staleTime: 60_000, // 1 min — stats journalières, pas besoin d'être temps réel
    refetchInterval: 120_000, // poll toutes les 2 min si la page reste ouverte
  });
};

export const useLatestOrders = (params?: { page?: number; perPage?: number; status?: string }) => {
  return useQuery({
    queryKey: ['latest-orders', params],
    queryFn: () => dashboardService.getLatestOrders(params),
    staleTime: 20_000, // 20s — liste des dernières commandes sur le dashboard
    refetchInterval: 30_000,
  });
};

export const usePlatformStats = () => {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => dashboardService.getPlatformStats(),
    staleTime: 5 * 60_000, // 5 min — stats plateforme changent rarement
  });
};

export const useTenants = () => {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: () => dashboardService.getTenants(),
    staleTime: 2 * 60_000,
  });
};
