import { useAuth } from '@/contexts/AuthContext';
import { Permission, UserRole, ROLE_PERMISSIONS, ADMIN, OWNER, MANAGER, HEAD_CHEF, CHEF, WAITER, CASHIER } from '@/types/permissions';
import { useMemo } from 'react';

export function usePermissions() {
  const { user } = useAuth();

  const userRole = user?.role as UserRole;
  const isSuperAdmin = user?.platformRole === 'super_admin';

  const userPermissions = useMemo(() => {
    if (isSuperAdmin) return Object.values(Permission);
    if (!userRole) return [];
    return ROLE_PERMISSIONS[userRole] || [];
  }, [userRole, isSuperAdmin]);

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (!userRole) return false;
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const hasRole = (role: UserRole): boolean => {
    if (isSuperAdmin) return true;
    return userRole === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (isSuperAdmin) return true;
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
