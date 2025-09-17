import { useQuery } from '@tanstack/react-query';
import { getOrderTracking } from '@/actions/public/order-tracking-actions';
import { useEffect } from 'react';
import { pusherClient } from '@/lib/pusherClient';

const fetchOrderTracking = async (orderId: string | null) => {
  if (!orderId) return null;
  const result = await getOrderTracking({ orderId });
  if (!result.data) {
    throw new Error("Commande introuvable");
  }
  return result.data;
}

export function useOrderTracking(orderId: string | null) {
  const query = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderTracking(orderId),
    enabled: !!orderId,
    refetchInterval: 10000, // Actualisation toutes les 10 secondes
    refetchOnWindowFocus: true,
    staleTime: 5000, // Considérer les données comme périmées après 5 secondes
  });

  useEffect(() => {
    if (!orderId) return;
    const channel = pusherClient.subscribe('restaurant-channel');
    const handler = (data: { orderId: string; status: string }) => {
      if (data.orderId === orderId) {
        query.refetch();
      }
    };
    channel.bind('order-status-updated', handler);
    return () => {
      channel.unbind('order-status-updated', handler);
      pusherClient.unsubscribe('restaurant-channel');
    };
  }, [orderId, query]);

  return query;
} 