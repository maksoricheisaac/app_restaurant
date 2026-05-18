import api from '@/lib/api-client';

export const reportsService = {
  getMetrics: async (params?: { type: 'daily' | 'weekly' | 'monthly' | 'yearly'; date?: string }) => {
    return api.get('/reports/metrics', { params });
  },

  getChartData: async (params?: { type: 'daily' | 'weekly' | 'monthly' | 'yearly'; date?: string }) => {
    return api.get('/reports/chart-data', { params });
  },
};
