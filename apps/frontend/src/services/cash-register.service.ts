import api from '@/lib/api-client';

export const cashRegisterService = {
  processPayment: async (paymentData: any) => {
    return api.post('/cash-register/pay', paymentData);
  },

  getTransactions: async (filters?: any) => {
    return api.get('/cash-register/transactions', { params: filters });
  },

  getBilan: async (date?: string) => {
    return api.get('/cash-register/bilan', { params: { date } });
  },

  getUnpaidOrders: async () => {
    return api.get('/cash-register/unpaid-orders');
  },
};
