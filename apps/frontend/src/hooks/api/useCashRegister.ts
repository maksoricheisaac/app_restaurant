import { useQuery } from '@tanstack/react-query';
import { cashRegisterService } from '@/services/cash-register.service';
import { queryKeys } from '@/lib/query-keys';

export interface CashRegisterSession {
  id: string;
  status: 'open' | 'closed';
  openedBy: string;
  openedByUser?: { id: string; name: string } | null;
  openedAt: string;
  openingAmount: number;
  closedBy?: string | null;
  closedByUser?: { id: string; name: string } | null;
  closedAt?: string | null;
  closingAmount?: number | null;
  expectedAmount?: number | null;
  variance?: number | null;
  notes?: string | null;
}

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

export const useCurrentCashSession = () => {
  return useQuery({
    queryKey: queryKeys.cashRegister.currentSession(),
    queryFn: () =>
      cashRegisterService.getCurrentSession() as Promise<CashRegisterSession | null>,
    staleTime: 15_000, // l'état ouvert/fermé doit rester à jour entre postes de caisse
    refetchInterval: 30_000,
  });
};

export const useCashSessionHistory = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: queryKeys.cashRegister.sessionHistory(params),
    queryFn: () => cashRegisterService.getSessionHistory(params),
  });
};
