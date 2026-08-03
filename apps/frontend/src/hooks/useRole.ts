import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'owner' | 'manager' | 'waiter' | 'chef' | 'cashier';

export function useRole() {
  const { user, isLoading } = useAuth();
  
  const role = user?.role as UserRole | undefined;
  
  const isOwner = role === 'owner';
  const isManager = role === 'manager';
  const isOwnerOrManager = isOwner || isManager;
  
  const hasRole = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!role) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    
    return role === requiredRole;
  };
  
  const hasPermission = (permission: 'read' | 'write' | 'owner'): boolean => {
    if (!role) return false;
    
    switch (permission) {
      case 'owner':
        return isOwner;
      case 'write':
        return isOwnerOrManager;
      case 'read':
        return isOwnerOrManager; // Les utilisateurs normaux n'ont pas accès aux données admin
      default:
        return false;
    }
  };
  
  return {
    user,
    role,
    isLoading,
    isOwner,
    isManager,
    isOwnerOrManager,
    hasRole,
    hasPermission,
    // Helpers pour des vérifications courantes
    canAccessAdmin: isOwnerOrManager,
    canModifySettings: isOwner,
    canViewReports: isOwnerOrManager,
    canManageUsers: isOwner,
  };
} 