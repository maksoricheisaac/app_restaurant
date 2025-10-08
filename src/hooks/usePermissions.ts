import { useSession } from '@/lib/auth-client';
import { Permission, UserRole, ROLE_PERMISSIONS, ADMIN, OWNER, MANAGER, HEAD_CHEF, CHEF, WAITER, CASHIER } from '@/types/permissions';
import { useMemo } from 'react';

export function usePermissions() {
  const { data: session } = useSession();
  const user = session?.user;

  const userRole = user?.role as UserRole;
  const userPermissions = useMemo(() => {
    if (!userRole) return [];
    return ROLE_PERMISSIONS[userRole] || [];
  }, [userRole]);

  const hasPermission = (permission: Permission): boolean => {
    if (!user || !userRole) return false;
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const hasRole = (role: UserRole): boolean => {
    return userRole === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.includes(userRole);
  };

  const isAdmin = (): boolean => {
    return hasAnyRole([ADMIN, OWNER]);
  };

  const isManager = (): boolean => {
    return hasAnyRole([ADMIN, OWNER, MANAGER]);
  };

  const isStaff = (): boolean => {
    return hasAnyRole([
      ADMIN,
      OWNER,
      MANAGER,
      HEAD_CHEF,
      CHEF,
      WAITER,
      CASHIER
    ]);
  };

  return {
    user,
    userRole,
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager,
    isStaff
  };
}
