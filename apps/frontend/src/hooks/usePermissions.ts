import { useAuth } from '@/contexts/AuthContext';
import { Permission, UserRole, ROLE_PERMISSIONS, OWNER, MANAGER, CHEF, WAITER, CASHIER } from '@/types/permissions';
import { useMemo } from 'react';

export function usePermissions() {
  const { user } = useAuth();

  const userRole = user?.role as UserRole;

  const userPermissions = useMemo(() => {
    if (!userRole) return [];
    return ROLE_PERMISSIONS[userRole] || [];
  }, [userRole]);

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
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
    return userRole === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.includes(userRole);
  };

  const isOwner = (): boolean => hasRole(OWNER);

  const isManager = (): boolean => hasAnyRole([OWNER, MANAGER]);

  const isStaff = (): boolean =>
    hasAnyRole([OWNER, MANAGER, CHEF, WAITER, CASHIER]);

  return {
    user,
    userRole,
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isOwner,
    isManager,
    isStaff
  };
}
