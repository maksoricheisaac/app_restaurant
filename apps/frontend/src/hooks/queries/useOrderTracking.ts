import { useQuery } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';
import { useSocketEvent } from '@/hooks/useSocketEvent';

export function useOrderTracking(orderId: string | null) {
  const query = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderId ? ordersService.getOrderTracking(orderId) : null,
    enabled: !!orderId,
    staleTime: 5000,
  });

  // Mise à jour en temps réel via WebSocket
  useSocketEvent(`order-tracking-${orderId}`, (data: { status: string }) => {
    query.refetch();
  });

  return query;
}
 