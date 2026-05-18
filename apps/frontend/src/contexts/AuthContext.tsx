"use client"
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

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
  accountType?: string | null;
  onboardingStep?: number;
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<User | null>;
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
 * Sets session + tenant cookies as httpOnly via the /api/session Next.js route.
 * document.cookie cannot set httpOnly — only a server-side Set-Cookie header can.
 * Fire-and-forget: the proxy redirect is a UX optimization, not a security gate.
 */
async function setSessionCookies(tenantId?: string | null): Promise<void> {
  try {
    await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: tenantId ?? undefined }),
    });
  } catch { /* non-blocking */ }
}

async function clearSessionCookies(): Promise<void> {
  try {
    await fetch('/api/session', { method: 'DELETE' });
  } catch { /* non-blocking */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          // Synchronise les cookies httpOnly via /api/session
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
    // Fire-and-forget — cookie update is non-blocking
    if (u) {
      void setSessionCookies(u.tenantId);
    } else {
      void clearSessionCookies();
    }
  };

  const login = async (email: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const data = await response.json();
        const loggedUser: User = data.user;
        setUserState(loggedUser);
        await setSessionCookies(loggedUser?.tenantId);
        return loggedUser;
      }
      return null;
    } catch {
      return null;
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
