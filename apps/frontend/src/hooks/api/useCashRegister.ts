import { useQuery } from '@tanstack/react-query';
import { cashRegisterService } from '@/services/cash-register.service';

export const useTransactions = (filters?: any) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => cashRegisterService.getTransactions(filters),
  });
};

export const useBilan = (date?: string) => {
  return useQuery({
    queryKey: ['bilan', date],
    queryFn: () => cashRegisterService.getBilan(date),
  });
};

export const useUnpaidOrders = () => {
  return useQuery({
    queryKey: ['unpaid-orders'],
    queryFn: () => cashRegisterService.getUnpaidOrders(),
  });
};
