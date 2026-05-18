import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settings.service";

export const useSettings = () => {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsService.getSettings(),
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => settingsService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
};

export const useDeliveryZones = () => {
  return useQuery({
    queryKey: ["delivery-zones"],
    queryFn: () => settingsService.getDeliveryZones(),
  });
};

export const useCreateDeliveryZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => settingsService.createDeliveryZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    },
  });
};

export const useUpdateDeliveryZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      settingsService.updateDeliveryZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    },
  });
};

export const useDeleteDeliveryZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settingsService.deleteDeliveryZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    },
  });
};

export const useOpeningHours = () => {
  return useQuery({
    queryKey: ["opening-hours"],
    queryFn: () => settingsService.getOpeningHours(),
  });
};

export const useUpdateOpeningHours = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => settingsService.updateOpeningHours(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opening-hours"] });
    },
  });
};

export const useSocialLinks = () => {
  return useQuery({
    queryKey: ["social-links"],
    queryFn: () => settingsService.getSocialLinks(),
  });
};

export const useUpdateSocialLinks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => settingsService.updateSocialLinks(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-links"] });
    },
  });
};

export const useLimits = () => {
  return useQuery({
    queryKey: ["limits"],
    queryFn: () => settingsService.getLimits(),
  });
};

export const useUpdateLimits = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => settingsService.updateLimits(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["limits"] });
    },
  });
};
