import { monitoring } from './monitoring';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface RequestOptions extends RequestInit {
  params?: Record<string, unknown>;
  _retry?: boolean;
  _requestId?: string;
}

// Single in-flight refresh promise to avoid race conditions
let refreshPromise: Promise<boolean> | null = null;

function generateRequestId(): string {
  // Préfixe 'fe-' pour distinguer les requêtes frontend dans les logs backend
  return `fe-${crypto.randomUUID()}`;
}

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => { refreshPromise = null; });

  return refreshPromise;
}

// Returns `any`, not `unknown`: API responses are consumed as `any` throughout
// src/services/*.ts and src/hooks/api/*.ts (see eslint.config.mjs). `unknown` here forced a
// manual cast/narrowing at every single call site for no real safety gain, since none of those
// call sites were actually narrowing the type — they were just accessing properties straight through.
async function fetchWithInterceptor(endpoint: string, options: RequestOptions = {}): Promise<any> {
  const { params, _retry = false, _requestId, ...init } = options;

  let url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) url += (url.includes('?') ? '&' : '?') + queryString;
  }

  // requestId — généré une seule fois et propagé sur les retries
  const requestId = _requestId ?? generateRequestId();

  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Propagation du requestId pour corrélation frontend↔backend dans les logs
  headers.set('X-Request-ID', requestId);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
      credentials: init.credentials ?? 'include',
    });
  } catch (networkError) {
    monitoring.captureError(networkError, {
      context: 'api-client:network',
      extra: { endpoint, requestId },
    });
    throw new Error('Erreur réseau — vérifiez votre connexion.');
  }

  // Auto-refresh on 401 (once)
  if (response.status === 401 && !_retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return fetchWithInterceptor(endpoint, { ...options, _retry: true, _requestId: requestId });
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    throw new Error('Session expirée');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
    const message = (errorData.message as string) || `HTTP error! status: ${response.status}`;
    const backendRequestId = response.headers.get('X-Request-ID') ?? requestId;

    monitoring.addBreadcrumb({
      category: 'api',
      message: `${init.method ?? 'GET'} ${endpoint} → ${response.status}`,
      level: response.status >= 500 ? 'error' : 'warning',
      data: { requestId: backendRequestId, status: response.status },
    });

    throw new Error(message);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) return response.json();
  return response.text();
}

const api = {
  get: (url: string, options?: RequestOptions) =>
    fetchWithInterceptor(url, { ...options, method: 'GET' }),

  post: (url: string, data?: unknown, options?: RequestOptions) =>
    fetchWithInterceptor(url, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    }),

  put: (url: string, data?: unknown, options?: RequestOptions) =>
    fetchWithInterceptor(url, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    }),

  patch: (url: string, data?: unknown, options?: RequestOptions) =>
    fetchWithInterceptor(url, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    }),

  delete: (url: string, options?: RequestOptions) =>
    fetchWithInterceptor(url, { ...options, method: 'DELETE' }),
};

export default api;
