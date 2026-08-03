import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionsService } from "@/services/permissions.service";

export const usePermissionCatalog = () =>
  useQuery({
    queryKey: ["permission-catalog"],
    queryFn: () => permissionsService.getCatalog(),
    staleTime: 60 * 60 * 1000, // catalogue statique
  });

export const useAllRolePermissions = () =>
  useQuery<{ role: string; permissions: string[] }[]>({
    queryKey: ["role-permissions"],
    queryFn: () => permissionsService.getAllRolePermissions(),
  });

export const useRolePermissions = (role: string) =>
  useQuery({
    queryKey: ["role-permissions", role],
    queryFn: () => permissionsService.getRolePermissions(role),
    enabled: !!role,
  });

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ role, permissions }: { role: string; permissions: string[] }) =>
      permissionsService.updateRolePermissions(role, permissions),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions", variables.role] });
    },
  });
};

export const useResetRolePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (role: string) => permissionsService.resetRolePermissions(role),
    onSuccess: (_data, role) => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions", role] });
    },
  });
};

export const useUserPermissions = (userId: string) =>
  useQuery({
    queryKey: ["user-permissions", userId],
    queryFn: () => permissionsService.getUserPermissions(userId),
    enabled: !!userId,
  });

export const useSetUserPermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      permission,
      granted,
    }: {
      userId: string;
      permission: string;
      granted: boolean;
    }) => permissionsService.setUserPermission(userId, { permission, granted }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", variables.userId] });
    },
  });
};
