"use client";

import { ReactNode } from 'react';
import { useRole, UserRole } from '@/hooks/useRole';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole | UserRole[];
  fallback?: ReactNode;
  showFallback?: boolean;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback = null, 
  showFallback = false 
}: RoleGuardProps) {
  const { hasRole, isLoading } = useRole();
  
  if (isLoading) {
    return null; // Ne rien afficher pendant le chargement
  }
  
  const hasAccess = hasRole(allowedRoles);
  
  if (!hasAccess) {
    return showFallback ? <>{fallback}</> : null;
  }
  
  return <>{children}</>;
}

// Composants spécialisés pour des cas d'usage courants.
//
// Le compte racine n'est nommé nulle part : `hasRole` le laisse passer partout,
// comme `RolesGuard` côté serveur. L'énumérer ici ne ferait que multiplier les
// occasions d'en oublier une.
export function OwnerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles="owner" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function OwnerOrManager({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['owner', 'manager']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
} 