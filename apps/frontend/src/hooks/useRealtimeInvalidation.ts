'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from './useSocketEvent';
import { queryKeys, INVALIDATION_GROUPS } from '@/lib/query-keys';

/**
 * Invalide automatiquement les caches React Query en réponse aux événements WebSocket.
 * Monté dans AdminNotificationProvider — actif pour toute la session admin.
 */
export function useRealtimeInvalidation() {
  const queryClient = useQueryClient();

  const onNewOrder = useCallback((_data: unknown) => {
    for (const key of INVALIDATION_GROUPS.newOrder) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  }, [queryClient]);

  const onOrderStatusUpdated = useCallback((data: { id?: string } | unknown) => {
    const id = (data as { id?: string })?.id;
    const keys = id
      ? INVALIDATION_GROUPS.orderStatusUpdate(id)
      : [queryKeys.orders.all(), queryKeys.orders.kitchen()];
    for (const key of keys) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  }, [queryClient]);

  const onNewReservation = useCallback((_data: unknown) => {
    for (const key of INVALIDATION_GROUPS.newReservation) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  }, [queryClient]);

  const onNewMessage = useCallback((_data: unknown) => {
    for (const key of INVALIDATION_GROUPS.newMessage) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  }, [queryClient]);

  useSocketEvent('new-order', onNewOrder);
  useSocketEvent('order-status-updated', onOrderStatusUpdated);
  useSocketEvent('new-reservation', onNewReservation);
  useSocketEvent('new-message', onNewMessage);
}
