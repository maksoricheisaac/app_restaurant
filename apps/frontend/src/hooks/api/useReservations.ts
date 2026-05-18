import { useQuery } from '@tanstack/react-query';
import { reservationsService } from '@/services/reservations.service';

export const useReservations = (filters?: any) => {
  return useQuery({
    queryKey: ['reservations', filters],
    queryFn: () => reservationsService.getReservations(filters),
  });
};
