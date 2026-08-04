import api from '@/lib/api-client';
import { OrderStatus } from '@/types/order';

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

  updateOrderStatus: async (id: string, status: OrderStatus, reason?: string) => {
    return api.patch(`/orders/${id}/status`, { status, reason });
  },

  // ── Vie du ticket ouvert ──────────────────────────────────────────────────

  /** Tickets encore ouverts — écran de service en salle. */
  getOpenTickets: async () => {
    return api.get('/orders/open');
  },

  /** Ajoute une tournée. Par défaut en brouillon : on compose puis on envoie. */
  addLines: async (
    orderId: string,
    items: unknown[],
    sendImmediately = false,
  ) => {
    return api.post(`/orders/${orderId}/lines`, { items, sendImmediately });
  },

  updateLineQuantity: async (orderId: string, lineId: string, quantity: number) => {
    return api.patch(`/orders/${orderId}/lines/${lineId}`, { quantity });
  },

  /** Retire une ligne encore en brouillon — rien n'a été préparé. */
  removeLine: async (orderId: string, lineId: string) => {
    return api.delete(`/orders/${orderId}/lines/${lineId}`);
  },

  /** Annule une ligne déjà partie en cuisine. Motif obligatoire. */
  voidLine: async (orderId: string, lineId: string, reason: string) => {
    return api.post(`/orders/${orderId}/lines/${lineId}/void`, { reason });
  },

  sendToKitchen: async (orderId: string) => {
    return api.post(`/orders/${orderId}/send`, {});
  },

  advanceLine: async (orderId: string, lineId: string, status: string) => {
    return api.patch(`/orders/${orderId}/lines/${lineId}/status`, { status });
  },

  getKitchenOrders: async () => {
    return api.get('/orders/kitchen');
  },

  getOrderTracking: async (id: string) => {
    return api.get(`/orders/${id}/tracking`);
  },
};
