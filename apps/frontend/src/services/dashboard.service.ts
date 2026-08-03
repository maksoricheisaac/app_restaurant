import api, { RequestOptions } from '@/lib/api-client';

export const dashboardService = {
  getStats: async (params?: { date?: string }, options?: RequestOptions) => {
    try {
      const response = await api.get('/dashboard/stats', { ...options, params });
      return {
        ordersCount: response.ordersCount ?? 0,
        reservationsCount: response.reservationsCount ?? 0,
        activeCustomers: response.activeCustomers ?? 0,
        // Encaissé et commandé sont distincts : c'est la même source que les
        // rapports, qui affichaient auparavant un autre montant.
        revenueCollected: response.revenueCollected ?? 0,
        revenueOrdered: response.revenueOrdered ?? 0,
        revenueOutstanding: response.revenueOutstanding ?? 0,
      };
    } catch {
      // Repli si le tableau de bord est appelé avant la fin de l'installation
      return {
        ordersCount: 0,
        reservationsCount: 0,
        activeCustomers: 0,
        revenueCollected: 0,
        revenueOrdered: 0,
        revenueOutstanding: 0,
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
};
