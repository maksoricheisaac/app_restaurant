import api from '@/lib/api-client';

export const customersService = {
  getCustomers: async (params?: any) => {
    return api.get('/customers', { params });
  },

  getCustomerById: async (id: string) => {
    return api.get(`/customers/${id}`);
  },

  createCustomer: async (customerData: any) => {
    return api.post('/customers', customerData);
  },

  updateCustomer: async (id: string, customerData: any) => {
    return api.patch(`/customers/${id}`, customerData);
  },

  deleteCustomer: async (id: string) => {
    return api.delete(`/customers/${id}`);
  },
};
