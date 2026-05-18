import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionsService } from "@/services/permissions.service";

export const usePersonnel = () => {
  return useQuery({
    queryKey: ["personnel"],
    queryFn: () => permissionsService.getPersonnel(),
  });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => permissionsService.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel"] });
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      permissionsService.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel"] });
    },
  });
};

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => permissionsService.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel"] });
    },
  });
};

export const useRolePermissions = (role: string) => {
  return useQuery({
    queryKey: ["role-permissions", role],
    queryFn: () => permissionsService.getRolePermissions(role),
    enabled: !!role,
  });
};

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ role, permissions }: { role: string; permissions: string[] }) => 
      permissionsService.updateRolePermissions(role, permissions),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions", variables.role] });
    },
  });
};
