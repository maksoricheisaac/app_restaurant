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

// Composants spécialisés pour des cas d'usage courants
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