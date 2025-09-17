"use client";

import { useSession } from '@/lib/auth-client';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'manager';
}

export function ProtectedRoute({ children, requiredRole = 'manager' }: ProtectedRouteProps) {
  const { data: session, isPending: isLoading, error } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/login?redirectTo=/admin/dashboard');
      return;
    }

    if (!isLoading && session) {
      const userRole = session.user?.role;
      
      // Vérifier si l'utilisateur a le rôle requis
      if (!userRole || (userRole !== 'admin' && userRole !== 'manager')) {
        router.replace('/login?error=access_denied');
        return;
      }

      // Si un rôle spécifique est requis, vérifier s'il correspond
      if (requiredRole === 'admin' && userRole !== 'admin') {
        router.replace('/login?error=insufficient_permissions');
        return;
      }
    }
  }, [isLoading, session, router, requiredRole]);

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

  const userRole = session.user?.role;
  if (!userRole || (userRole !== 'admin' && userRole !== 'manager')) {
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

  if (requiredRole === 'admin' && userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-yellow-800 mb-2">Permissions insuffisantes</h1>
          <p className="text-yellow-600 mb-4">Cette section nécessite des privilèges d&apos;administrateur.</p>
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