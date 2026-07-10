import { useQuery } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';
import { queryKeys } from '@/lib/query-keys';

export interface OrderFilters {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
  // Index signature requise par queryKeys.orders.list() (Record<string, unknown>).
  [key: string]: unknown;
}

export const useOrders = (filters: OrderFilters = {}) => {
  return useQuery({
    // Clé issue de la factory centralisée (query-keys.ts) — pas de string
    // dupliquée à la main, pour que les invalidations de mutation restent
    // forcément synchronisées avec la clé réellement utilisée ici.
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => ordersService.getOrders(filters),
    staleTime: 30_000, // 30s — commandes : données très fraîches requises
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersService.getOrderById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
};

export const useKitchenOrders = () => {
  return useQuery({
    queryKey: queryKeys.orders.kitchen(),
    queryFn: () => ordersService.getKitchenOrders(),
    staleTime: 10_000, // 10s — KDS doit être très réactif
    refetchInterval: 30_000, // polling de sécurité si WebSocket coupe
  });
};
