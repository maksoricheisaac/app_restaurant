import api from '@/lib/api-client';

export const publicService = {
  getMenu: async (params?: any) => {
    return api.get('/menu', { params });
  },

  getCategories: async () => {
    return api.get('/categories');
  },

  createOrder: async (orderData: any) => {
    return api.post('/orders', orderData);
  },
};
