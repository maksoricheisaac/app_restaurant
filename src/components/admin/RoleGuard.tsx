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
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles="admin" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ManagerOrAdmin({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
} 