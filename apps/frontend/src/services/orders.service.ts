import api from '@/lib/api-client';
import { Order, OrderStatus } from '@/types/order';

export const ordersService = {
  getOrders: async (filters: any) => {
    return api.get('/orders', { params: filters });
  },

  getOrderById: async (id: string) => {
    return api.get(`/orders/${id}`);
  },

  createOrder: async (orderData: any) => {
    return api.post('/orders', orderData);
  },

  updateOrderStatus: async (id: string, status: OrderStatus) => {
    return api.patch(`/orders/${id}/status`, { status });
  },

  getKitchenOrders: async () => {
    return api.get('/orders/kitchen');
  },

  getOrderTracking: async (id: string) => {
    return api.get(`/orders/${id}/tracking`);
  },
};
