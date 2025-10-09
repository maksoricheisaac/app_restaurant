"use client";

import { useSession } from '@/lib/auth-client';
import { ReactNode } from 'react';
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

  // Pas de redirection automatique - on affiche juste les messages d'erreur

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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Erreur d&apos;authentification</h1>
          <p className="text-red-600 mb-4">Une erreur s&apos;est produite lors de la vérification de votre session.</p>
          <p className="text-sm text-gray-600">Veuillez contacter votre administrateur si le problème persiste.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-blue-600 text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-blue-800 mb-2">Authentification requise</h1>
          <p className="text-blue-600 mb-4">Vous devez être connecté pour accéder à cette page.</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // Vérifications côté client pour l'affichage
  if (!isStaff()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-red-600 text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-red-800 mb-3">Accès refusé</h1>
          <p className="text-red-600 mb-2">Vous n&apos;avez pas les permissions nécessaires pour accéder à cette section.</p>
          <p className="text-sm text-gray-600 mb-6">Cette zone est réservée au personnel du restaurant.</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 font-medium">Contactez votre administrateur si vous pensez que c&apos;est une erreur.</p>
          </div>
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
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-yellow-800 mb-3">Permissions insuffisantes</h1>
          <p className="text-yellow-600 mb-2">{errorMessage}</p>
          <p className="text-sm text-gray-600 mb-6">Votre rôle actuel ne vous permet pas d&apos;accéder à cette fonctionnalité.</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-700 font-medium">Contactez votre administrateur pour obtenir les permissions nécessaires.</p>
          </div>
          <button 
            onClick={() => router.push('/admin/dashboard')}
            className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium w-full"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}