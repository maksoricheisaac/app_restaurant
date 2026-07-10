import api, { RequestOptions } from '@/lib/api-client';

export const dashboardService = {
  getStats: async (params?: { date?: string }, options?: RequestOptions) => {
    try {
      const response = await api.get('/dashboard/stats', { ...options, params });
      return {
        totalOrders: response.ordersCount ?? 0,
        totalRevenue: response.totalRevenue ?? 0,
        activeCustomers: response.activeCustomers ?? 0,
        totalReservations: response.reservationsCount ?? 0,
      };
    } catch {
      // Fallback pour super_admin sans tenant
      return {
        totalOrders: 0,
        totalRevenue: 0,
        activeCustomers: 0,
        totalReservations: 0,
      };
    }
  },

  getSidebarCounts: async (options?: RequestOptions) => {
    return api.get('/dashboard/sidebar-counts', options);
  },

  getLatestOrders: async (params?: { page?: number; perPage?: number; status?: string }, options?: RequestOptions) => {
    const { perPage, ...rest } = params || {};
    const response = await api.get('/orders', {
      ...options,
      params: { ...rest, limit: perPage },
    });
    return {
      orders: response.data,
      pagination: response.pagination,
    };
  },

  getPlatformStats: async (options?: RequestOptions) => {
    return api.get('/dashboard/platform-stats', options);
  },

  getTenants: async (options?: RequestOptions) => {
    return api.get('/tenants', options);
  },
};
