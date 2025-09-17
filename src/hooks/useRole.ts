import { useSession } from '@/lib/auth-client';

export type UserRole = 'admin' | 'manager' | 'user';

export function useRole() {
  const { data: session, isPending: isLoading } = useSession();
  
  const user = session?.user;
  const role = user?.role as UserRole | undefined;
  
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isAdminOrManager = isAdmin || isManager;
  
  const hasRole = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!role) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    
    return role === requiredRole;
  };
  
  const hasPermission = (permission: 'read' | 'write' | 'admin'): boolean => {
    if (!role) return false;
    
    switch (permission) {
      case 'admin':
        return isAdmin;
      case 'write':
        return isAdminOrManager;
      case 'read':
        return isAdminOrManager; // Les utilisateurs normaux n'ont pas accès aux données admin
      default:
        return false;
    }
  };
  
  return {
    user,
    role,
    isLoading,
    isAdmin,
    isManager,
    isAdminOrManager,
    hasRole,
    hasPermission,
    // Helpers pour des vérifications courantes
    canAccessAdmin: isAdminOrManager,
    canModifySettings: isAdmin,
    canViewReports: isAdminOrManager,
    canManageUsers: isAdmin,
  };
} 