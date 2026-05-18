"use client";

import { usePermissions } from '@/hooks/usePermissions';
import { Permission, UserRole } from '@/types/permissions';
import { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  role?: UserRole;
  roles?: UserRole[];
  requireAll?: boolean; // Si true, toutes les permissions sont requises, sinon au moins une
  fallback?: ReactNode;
  showError?: boolean;
}

export function PermissionGuard({
  children,
  permission,
  permissions = [],
  role,
  roles = [],
  requireAll = false,
  fallback,
  showError = true
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } = usePermissions();

  // Vérification des permissions
  let hasRequiredPermissions = true;

  if (permission) {
    hasRequiredPermissions = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  // Vérification des rôles
  let hasRequiredRoles = true;

  if (role) {
    hasRequiredRoles = hasRole(role);
  } else if (roles.length > 0) {
    hasRequiredRoles = hasAnyRole(roles);
  }

  const hasAccess = hasRequiredPermissions && hasRequiredRoles;

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <Alert variant="destructive" className="m-4">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette section.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}
