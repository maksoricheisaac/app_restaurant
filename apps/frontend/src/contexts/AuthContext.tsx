"use client"
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  /** owner | manager | waiter | chef | cashier */
  role?: string | null;
  image?: string | null;
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
 * Le cookie httpOnly `session` n'est qu'un drapeau lu par le middleware pour
 * son contrôle optimiste. L'authentification réelle repose sur le cookie
 * `token` posé par le backend, et le rôle effectif est relu en base à chaque
 * requête — le client ne détient aucune information de droits.
 */
async function setSessionFlag(): Promise<void> {
  try {
    await fetch('/api/session', { method: 'POST' });
  } catch { /* non bloquant */ }
}

async function clearSessionFlag(): Promise<void> {
  try {
    await fetch('/api/session', { method: 'DELETE' });
  } catch { /* non bloquant */ }
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
          // Rafraîchissement silencieux — échoue normalement sur les pages
          // publiques, où aucune session n'existe.
          const refreshed = await apiFetch('/auth/refresh', { method: 'POST' });
          if (refreshed.ok) {
            res = await apiFetch('/auth/profile');
          } else {
            await clearSessionFlag();
            setUserState(null);
            return;
          }
        }

        if (res.ok) {
          setUserState(await res.json());
          await setSessionFlag();
        } else {
          await clearSessionFlag();
          setUserState(null);
        }
      } catch {
        // Erreur réseau au montage — on reste déconnecté silencieusement
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) void setSessionFlag();
    else void clearSessionFlag();
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
        // Remonter le vrai message du backend plutôt qu'un libellé générique
        const err = await response.json().catch(() => ({}));
        const message = err?.message || 'Identifiants invalides';
        throw new Error(typeof message === 'string' ? message : message[0]);
      }

      const data = await response.json();
      const loggedUser: User = data.user;
      setUserState(loggedUser);
      await setSessionFlag();
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
    await clearSessionFlag();
    // Purge du cache React Query : sur un appareil partagé (tablette caisse ou
    // cuisine), les données affichées pour un employé ne doivent jamais
    // réapparaître, même brièvement, pour le suivant.
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
