'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';
import { OrderStatus } from '@/types/order';
import { queryKeys } from '@/lib/query-keys';

// Invalidations partagées par les 3 mutations ci-dessous — passer par la
// factory (query-keys.ts) plutôt que des strings dupliquées à la main est
// ce qui évite qu'une clé d'invalidation se désynchronise silencieusement
// de la clé réellement utilisée par un useQuery (ex: 'dashboard' qui ne
// correspondait à aucune query réelle, ou 'kitchen-orders' qui ne
// correspondait pas à queryKeys.orders.kitchen()).
function invalidateOrderRelatedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId?: string,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.orders.kitchen() });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.latestOrders() });
  if (orderId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
  }
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersService.updateOrderStatus(id, status),
    onSuccess: (_, variables) => {
      invalidateOrderRelatedQueries(queryClient, variables.id);
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: any) => ordersService.createOrder(orderData),
    onSuccess: () => {
      invalidateOrderRelatedQueries(queryClient);
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersService.updateOrderStatus(id, 'cancelled'),
    onSuccess: (_, id) => {
      invalidateOrderRelatedQueries(queryClient, id);
    },
  });
};
