'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsService } from '@/services/reservations.service';
import { queryKeys } from '@/lib/query-keys';

function invalidateReservationRelatedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all() });
  // Une réservation occupe une table → disponibilités modifiées
  queryClient.invalidateQueries({ queryKey: queryKeys.tables.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
}

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => reservationsService.createReservation(data),
    onSuccess: () => invalidateReservationRelatedQueries(queryClient),
  });
};

export const useUpdateReservationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      reservationsService.updateStatus(id, status),
    onSuccess: () => invalidateReservationRelatedQueries(queryClient),
  });
};

export const useDeleteReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationsService.deleteReservation(id),
    onSuccess: () => invalidateReservationRelatedQueries(queryClient),
  });
};
