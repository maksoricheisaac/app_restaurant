'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventory.service';

export const useCreateIngredient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => inventoryService.createIngredient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
    },
  });
};

export const useAddStockMovement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => inventoryService.addMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
};
