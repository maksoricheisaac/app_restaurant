'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cashRegisterService } from '@/services/cash-register.service';
import { queryKeys } from '@/lib/query-keys';

export const useProcessPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => cashRegisterService.processPayment(data),
    onSuccess: () => {
      // Refresh all cash-register related data after payment
      queryClient.invalidateQueries({ queryKey: ['unpaid-orders'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bilan'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useOpenCashSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { openingAmount: number; notes?: string }) =>
      cashRegisterService.openSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashRegister.currentSession() });
    },
  });
};

export const useCloseCashSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { closingAmount: number; notes?: string }) =>
      cashRegisterService.closeSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashRegister.currentSession() });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashRegister.sessionHistory() });
    },
  });
};
