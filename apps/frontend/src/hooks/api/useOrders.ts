import { useQuery } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';

export const useOrders = (filters: any) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersService.getOrders(filters),
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersService.getOrderById(id),
    enabled: !!id,
  });
};
