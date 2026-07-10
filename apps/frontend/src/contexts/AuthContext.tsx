"use client"
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role?: string | null; // Membership role: owner, manager, waiter, etc.
  platformRole?: 'super_admin' | 'support' | 'user' | string;
  tenantId?: string | null;
  image?: string | null;
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  signOut: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

async function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API}${path}`, { credentials: 'include', ...init });
}

/**
 * Synchronise le `tenantId` de session (httpOnly cookie via /api/session +
 * localStorage pour l'api-client). AuthContext ne gère QUE le tenantId : il le
 * connaît de façon fiable depuis le profil / la réponse de login.
 *
 * Le `tenantSlug` est délibérément géré par TenantContext (source de vérité
 * unique, via persistTenant après résolution du tenant). Historiquement,
 * AuthContext passait `tenantSlug=null` en dur ici, ce qui effaçait le slug
 * fraîchement posé par TenantContext à chaque checkAuth/login/setUser — bug
 * corrigé en ne touchant plus du tout au slug.
 *
 * /api/session (POST) ne pose/écrase un cookie que s'il est présent dans le
 * body : n'envoyer que `tenantId` laisse donc le cookie `tenantSlug` intact.
 */
async function setSessionCookies(tenantId?: string | null): Promise<void> {
  if (typeof window !== 'undefined') {
    if (tenantId) {
      localStorage.setItem('tenantId', tenantId);
    } else {
      localStorage.removeItem('tenantId');
    }
  }

  try {
    await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: tenantId ?? undefined }),
    });
  } catch { /* non-blocking */ }
}

async function clearSessionCookies(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tenantId');
    localStorage.removeItem('tenantSlug');
  }
  try {
    await fetch('/api/session', { method: 'DELETE' });
  } catch { /* non-blocking */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        let res = await apiFetch('/auth/profile');

        if (res.status === 401) {
          // Try silent refresh — expected to fail on public pages (no session)
          const refreshed = await apiFetch('/auth/refresh', { method: 'POST' });
          if (refreshed.ok) {
            res = await apiFetch('/auth/profile');
          } else {
            // Unauthenticated visitor — not an error, just a public page
            clearSessionCookies();
            setUserState(null);
            return;
          }
        }

        if (res.ok) {
          const profile = await res.json();
          setUserState(profile);
          // Synchronise le cookie tenantId httpOnly + localStorage (le slug
          // reste géré par TenantContext).
          await setSessionCookies(profile?.tenantId);
        } else {
          await clearSessionCookies();
          setUserState(null);
        }
      } catch {
        // Network error on mount — stay logged out silently
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const setUser = (u: User | null) => {
    setUserState(u);
    // Sync httpOnly cookies + localStorage — fire-and-forget
    if (u) {
      void setSessionCookies(u.tenantId);
    } else {
      void clearSessionCookies();
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // Lire le vrai message d'erreur du backend pour l'afficher à l'utilisateur
        const err = await response.json().catch(() => ({}));
        const message = err?.message || 'Identifiants invalides';
        throw new Error(typeof message === 'string' ? message : message[0]);
      }

      const data = await response.json();
      const loggedUser: User = data.user;
      setUserState(loggedUser);
      await setSessionCookies(loggedUser?.tenantId);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    setUserState(null);
    await clearSessionCookies();
    // Purge tout le cache React Query — sur un appareil partagé (tablette
    // caisse/cuisine), les données du tenant précédent (commandes, clients,
    // stats) ne doivent jamais pouvoir s'afficher pour le compte suivant,
    // même brièvement le temps du premier refetch.
    queryClient.clear();
  };

  const value = useMemo(
    () => ({ user, setUser, login, logout, signOut: logout, isLoading }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
