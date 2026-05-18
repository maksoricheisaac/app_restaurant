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

export interface AccountTypePayload {
  accountType: 'OWNER' | 'MULTI_MANAGER' | 'FRANCHISE';
}

export interface RestaurantInfoPayload {
  restaurantName: string;
  slug: string;
  country: string;
  currency: string;
  timezone: string;
  cuisineType?: string;
}

export interface SelectPlanPayload {
  plan: 'free' | 'pro' | 'enterprise';
}

export interface OnboardingState {
  onboardingStep: number;
  onboardingCompleted: boolean;
  onboardingData: Record<string, unknown> | null;
  accountType: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export const onboardingService = {
  async initiate(payload: InitiateRegistrationPayload) {
    const res = await apiFetch('/onboarding/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ user: Record<string, unknown> }>(res);
  },

  async saveAccountType(payload: AccountTypePayload) {
    const res = await apiFetch('/onboarding/step/account-type', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ onboardingStep: number }>(res);
  },

  async saveRestaurantInfo(payload: RestaurantInfoPayload) {
    const res = await apiFetch('/onboarding/step/restaurant-info', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ onboardingStep: number }>(res);
  },

  async savePlan(payload: SelectPlanPayload) {
    const res = await apiFetch('/onboarding/step/plan', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ onboardingStep: number }>(res);
  },

  async complete() {
    const res = await apiFetch('/onboarding/complete', { method: 'POST' });
    return handleResponse<{
      success: boolean;
      tenant: { id: string; slug: string; name: string };
      user: Record<string, unknown>;
    }>(res);
  },

  async getState() {
    const res = await apiFetch('/onboarding/state');
    return handleResponse<OnboardingState>(res);
  },

  async checkSlug(slug: string): Promise<{ available: boolean }> {
    const res = await apiFetch(`/onboarding/check-slug?slug=${encodeURIComponent(slug)}`);
    return handleResponse<{ available: boolean }>(res);
  },
};
