"use client";

import { useSession } from '@/lib/auth-client';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission, UserRole } from '@/types/permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermission, 
  requiredPermissions = [], 
  requireAll = false 
}: ProtectedRouteProps) {
  const { data: session, isPending: isLoading, error } = useSession();
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, isStaff } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/login?redirectTo=/admin/dashboard');
      return;
    }

    if (!isLoading && session) {
      // Vérifier si l'utilisateur fait partie du personnel
      if (!isStaff()) {
        router.replace('/login?error=access_denied');
        return;
      }

      // Vérifier le rôle spécifique si requis
      if (requiredRole && !hasRole(requiredRole)) {
        router.replace('/login?error=insufficient_permissions');
        return;
      }

      // Vérifier les permissions
      if (requiredPermission && !hasPermission(requiredPermission)) {
        router.replace('/login?error=insufficient_permissions');
        return;
      }

      if (requiredPermissions.length > 0) {
        const hasRequiredPermissions = requireAll 
          ? hasAllPermissions(requiredPermissions)
          : hasAnyPermission(requiredPermissions);
        
        if (!hasRequiredPermissions) {
          router.replace('/login?error=insufficient_permissions');
          return;
        }
      }
    }
  }, [isLoading, session, router, requiredRole, requiredPermission, requiredPermissions, requireAll, hasPermission, hasAnyPermission, hasAllPermissions, hasRole, isStaff]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Vérification de l&apos;authentification...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Erreur d&apos;authentification</h1>
          <p className="text-red-600 mb-4">Une erreur s&apos;est produite lors de la vérification de votre session.</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Vérifications côté client pour l'affichage
  if (!isStaff()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Accès refusé</h1>
          <p className="text-red-600 mb-4">Vous n&apos;avez pas les permissions nécessaires pour accéder à cette section.</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  // Vérifier les permissions spécifiques
  let hasAccess = true;
  let errorMessage = "Vous n'avez pas les permissions nécessaires.";

  if (requiredRole && !hasRole(requiredRole)) {
    hasAccess = false;
    errorMessage = `Cette section nécessite le rôle ${requiredRole}.`;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    hasAccess = false;
    errorMessage = "Permission spécifique requise.";
  }

  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
    
    if (!hasRequiredPermissions) {
      hasAccess = false;
      errorMessage = requireAll 
        ? "Toutes les permissions requises ne sont pas accordées."
        : "Aucune des permissions requises n'est accordée.";
    }
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-yellow-800 mb-2">Permissions insuffisantes</h1>
          <p className="text-yellow-600 mb-4">{errorMessage}</p>
          <button 
            onClick={() => router.push('/admin/dashboard')}
            className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}