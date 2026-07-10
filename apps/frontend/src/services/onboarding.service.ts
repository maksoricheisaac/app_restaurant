import type { CompleteOnboardingPayload } from '@/types/onboarding';

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

export interface InitiateRegistrationPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const onboardingService = {
  /**
   * Étape 1 — crée le compte et ouvre une session (cookies posés par le backend).
   * Seul appel « écrivant » du wizard avant la finalisation.
   */
  async initiate(payload: InitiateRegistrationPayload) {
    const res = await apiFetch('/onboarding/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ user: Record<string, unknown> }>(res);
  },

  /**
   * Étape finale — envoie l'intégralité des données du restaurant. Le backend
   * crée tenant + settings + membership + catégories en une transaction unique
   * et renvoie les tokens frais (cookies), rendant la session immédiatement
   * cohérente sans reconnexion.
   */
  async complete(payload: CompleteOnboardingPayload) {
    const res = await apiFetch('/onboarding/complete', {
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
};
