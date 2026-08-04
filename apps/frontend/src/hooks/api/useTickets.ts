'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';
import { queryKeys } from '@/lib/query-keys';
import type { Order } from '@/types/order';

const OPEN_TICKETS_KEY = ['tickets', 'open'] as const;

/**
 * Après chaque opération sur un ticket, tout ce qui l'affiche doit repartir
 * du serveur : le total et le statut y sont recalculés depuis les lignes, les
 * deviner côté client reviendrait à réimplémenter la règle.
 */
function invalidateTicketViews(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId?: string,
) {
  queryClient.invalidateQueries({ queryKey: OPEN_TICKETS_KEY });
  queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.orders.kitchen() });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
  if (orderId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
  }
}

export const useOpenTickets = () => {
  return useQuery<Order[]>({
    queryKey: OPEN_TICKETS_KEY,
    queryFn: () => ordersService.getOpenTickets() as Promise<Order[]>,
    staleTime: 10_000,
  });
};

export const useAddTicketLines = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      items,
      sendImmediately,
    }: {
      orderId: string;
      items: unknown[];
      sendImmediately?: boolean;
    }) => ordersService.addLines(orderId, items, sendImmediately),
    onSuccess: (_, variables) =>
      invalidateTicketViews(queryClient, variables.orderId),
  });
};

export const useUpdateTicketLineQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      lineId,
      quantity,
    }: {
      orderId: string;
      lineId: string;
      quantity: number;
    }) => ordersService.updateLineQuantity(orderId, lineId, quantity),
    onSuccess: (_, variables) =>
      invalidateTicketViews(queryClient, variables.orderId),
  });
};

export const useRemoveTicketLine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, lineId }: { orderId: string; lineId: string }) =>
      ordersService.removeLine(orderId, lineId),
    onSuccess: (_, variables) =>
      invalidateTicketViews(queryClient, variables.orderId),
  });
};

export const useVoidTicketLine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      lineId,
      reason,
    }: {
      orderId: string;
      lineId: string;
      reason: string;
    }) => ordersService.voidLine(orderId, lineId, reason),
    onSuccess: (_, variables) =>
      invalidateTicketViews(queryClient, variables.orderId),
  });
};

export const useSendTicketToKitchen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => ordersService.sendToKitchen(orderId),
    onSuccess: (_, orderId) => invalidateTicketViews(queryClient, orderId),
  });
};

export const useAdvanceLine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      lineId,
      status,
    }: {
      orderId: string;
      lineId: string;
      status: string;
    }) => ordersService.advanceLine(orderId, lineId, status),
    onSuccess: (_, variables) =>
      invalidateTicketViews(queryClient, variables.orderId),
  });
};
