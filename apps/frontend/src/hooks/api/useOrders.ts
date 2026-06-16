import { useQuery } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';

export interface OrderFilters {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export const useOrders = (filters: OrderFilters = {}) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersService.getOrders(filters),
    staleTime: 30_000, // 30s — commandes : données très fraîches requises
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersService.getOrderById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
};

export const useKitchenOrders = () => {
  return useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: () => ordersService.getKitchenOrders(),
    staleTime: 10_000, // 10s — KDS doit être très réactif
    refetchInterval: 30_000, // polling de sécurité si WebSocket coupe
  });
};
