'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cashRegisterService } from '@/services/cash-register.service';

export const useProcessPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => cashRegisterService.processPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bilan'] });
    },
  });
};
