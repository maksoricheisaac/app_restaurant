import { useQuery } from '@tanstack/react-query';
import { reservationsService } from '@/services/reservations.service';

export interface ReservationFilters {
  date?: string;
  status?: string;
}

export const useReservations = (filters: ReservationFilters = {}) => {
  return useQuery({
    queryKey: ['reservations', filters],
    queryFn: () => reservationsService.getReservations(filters),
    staleTime: 30_000,
  });
};
