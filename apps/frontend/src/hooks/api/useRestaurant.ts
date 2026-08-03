import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurant.service';
import { formatCurrency as _format } from '@/lib/order-utils';
import type { Restaurant } from '@/types/restaurant';

const RESTAURANT_KEY = ['restaurant'] as const;

export const useRestaurant = () =>
  useQuery<Restaurant>({
    queryKey: RESTAURANT_KEY,
    queryFn: () => restaurantService.get(),
    // La configuration de l'établissement change rarement : inutile de la
    // refetcher à chaque montage d'écran.
    staleTime: 5 * 60 * 1000,
  });

/**
 * Formateur monétaire lié à la devise de l'établissement.
 * Repli sur EUR tant que la configuration n'est pas chargée.
 *
 *   const formatCurrency = useRestaurantCurrency();
 *   formatCurrency(1500) // « 1 500 FCFA » en XAF, « 1 500,00 € » en EUR
 */
export function useRestaurantCurrency(): (amount: number) => string {
  const { data } = useRestaurant();
  const currency = data?.currency ?? 'EUR';
  return useCallback((amount: number) => _format(amount, currency), [currency]);
}

function useRestaurantMutation(
  mutationFn: (data: any) => Promise<unknown>,
  extraKeys: readonly (readonly unknown[])[] = [],
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEY });
      for (const key of extraKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

export const useUpdateRestaurantIdentity = () =>
  useRestaurantMutation((data) => restaurantService.updateIdentity(data));

export const useUpdateRestaurantService = () =>
  useRestaurantMutation((data) => restaurantService.updateService(data));

export const useUpdateRestaurantCash = () =>
  useRestaurantMutation((data) => restaurantService.updateCash(data));

export const useUpdateRestaurantPrinting = () =>
  useRestaurantMutation((data) => restaurantService.updatePrinting(data));

export const useUpdateSocialLinks = () =>
  useRestaurantMutation((data) => restaurantService.updateSocialLinks(data));

// ─── Horaires ───────────────────────────────────────────────────────────────

export const useOpeningHours = () =>
  useQuery({
    queryKey: ['opening-hours'],
    queryFn: () => restaurantService.getOpeningHours(),
  });

export const useUpdateOpeningHours = () =>
  useRestaurantMutation(
    (data) => restaurantService.updateOpeningHours(data),
    [['opening-hours']],
  );

// ─── Zones de livraison ─────────────────────────────────────────────────────

export const useDeliveryZones = () =>
  useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => restaurantService.getDeliveryZones(),
  });

export const useCreateDeliveryZone = () =>
  useRestaurantMutation(
    (data) => restaurantService.createDeliveryZone(data),
    [['delivery-zones']],
  );

export const useUpdateDeliveryZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      restaurantService.updateDeliveryZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
    },
  });
};

export const useDeleteDeliveryZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restaurantService.deleteDeliveryZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
    },
  });
};
