import { useAuth } from '@/contexts/AuthContext';

export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'manager'
  | 'waiter'
  | 'chef'
  | 'cashier';

/**
 * Rôle du compte connecté et raccourcis d'affichage.
 *
 * Purement cosmétique : ce hook décide de ce qu'on montre, jamais de ce qu'on
 * autorise. L'autorisation est rendue par le backend, sur chaque appel.
 *
 * Le compte racine (`super_admin`) satisfait toute exigence de rôle, comme
 * `RolesGuard` côté serveur. Sans cette règle, l'interface masquerait des
 * écrans que l'API lui ouvre pourtant — le pire des deux mondes : des droits
 * complets et une navigation trouée.
 */
export function useRole() {
  const { user, isLoading } = useAuth();

  const role = user?.role as UserRole | undefined;

  const isSuperAdmin = role === 'super_admin';
  const isOwner = role === 'owner';
  const isManager = role === 'manager';
  /** Droits « propriétaire ou mieux » : le compte racine et le propriétaire. */
  const hasOwnerAuthority = isSuperAdmin || isOwner;
  const isOwnerOrManager = hasOwnerAuthority || isManager;

  const hasRole = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!role) return false;
    if (isSuperAdmin) return true;

    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }

    return role === requiredRole;
  };

  const hasPermission = (permission: 'read' | 'write' | 'owner'): boolean => {
    if (!role) return false;

    switch (permission) {
      case 'owner':
        return hasOwnerAuthority;
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
    isSuperAdmin,
    isOwner,
    isManager,
    hasOwnerAuthority,
    isOwnerOrManager,
    hasRole,
    hasPermission,
    // Helpers pour des vérifications courantes
    canAccessAdmin: isOwnerOrManager,
    canModifySettings: hasOwnerAuthority,
    canViewReports: isOwnerOrManager,
    canManageUsers: hasOwnerAuthority,
  };
}
