import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';

export const useDashboardStats = (params?: { date?: string }) => {
  return useQuery({
    queryKey: ['dashboard-stats', params],
    queryFn: () => dashboardService.getStats(params),
  });
};

export const useLatestOrders = (params?: { page?: number; perPage?: number; status?: string }) => {
  return useQuery({
    queryKey: ['latest-orders', params],
    queryFn: () => dashboardService.getLatestOrders(params),
  });
};

export const usePlatformStats = () => {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => dashboardService.getPlatformStats(),
  });
};

export const useTenants = () => {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: () => dashboardService.getTenants(),
  });
};
