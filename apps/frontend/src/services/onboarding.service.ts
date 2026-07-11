import type { RegisterPayload } from '@/types/onboarding';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API}${path}`, { credentials: 'include', ...init });
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as any)?.message ||
      (Array.isArray((data as any)?.message) ? (data as any).message[0] : null) ||
      `Erreur ${res.status}`;
    throw new Error(typeof message === 'string' ? message : message[0]);
  }
  return data as T;
}

export const onboardingService = {
  /**
   * Inscription complète en UN seul appel : le backend crée le compte ET le
   * restaurant dans une transaction unique, puis ouvre la session (cookies).
   * C'est le SEUL appel « écrivant » du parcours — rien n'est persisté avant.
   */
  async register(payload: RegisterPayload) {
    const res = await apiFetch('/onboarding/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{
      success: boolean;
      tenant: { id: string; slug: string; name: string };
      user: Record<string, unknown>;
    }>(res);
  },

  /** Lecture seule — vérifie la disponibilité d'un slug (aucune écriture). */
  async checkSlug(slug: string): Promise<{ available: boolean }> {
    const res = await apiFetch(`/onboarding/check-slug?slug=${encodeURIComponent(slug)}`);
    return handleResponse<{ available: boolean }>(res);
  },

  /** Lecture seule — vérifie qu'un email n'est pas déjà pris (aucune écriture). */
  async checkEmail(email: string): Promise<{ available: boolean }> {
    const res = await apiFetch(`/onboarding/check-email?email=${encodeURIComponent(email)}`);
    return handleResponse<{ available: boolean }>(res);
  },
};
