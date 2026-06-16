import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customersService } from "@/services/customers.service";

export const useCustomers = (params?: any) => {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => customersService.getCustomers(params),
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => customersService.getCustomerById(id),
    enabled: !!id,
  });
};

// createCustomer removed — customers are auto-generated from orders/reservations

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      customersService.updateCustomer(id, data),
    onSuccess: (_, variables) => {
      // Invalide la liste ET le détail du client modifié
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", variables.id] });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersService.deleteCustomer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      // Supprime le détail du client du cache immédiatement
      queryClient.removeQueries({ queryKey: ["customers", id] });
    },
  });
};
