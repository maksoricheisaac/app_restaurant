const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  _retry?: boolean;
}

// Single in-flight refresh promise to avoid race conditions
let refreshPromise: Promise<boolean> | null = null;

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

async function fetchWithInterceptor(endpoint: string, options: RequestOptions = {}): Promise<any> {
  const { params, _retry = false, ...init } = options;

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

  // Tenant context from localStorage (not secret, used for routing only)
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
  const tenantSlug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') : null;

  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (tenantId) headers.set('x-tenant-id', tenantId);
  else if (tenantSlug) headers.set('x-tenant-slug', tenantSlug);
  // Auth is via httpOnly cookie — no Authorization header from localStorage

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
  });

  // Auto-refresh on 401 (once)
  if (response.status === 401 && !_retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return fetchWithInterceptor(endpoint, { ...options, _retry: true });
    }
    // Refresh failed — redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    throw new Error('Session expirée');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) return response.json();
  return response.text();
}

const api = {
  get: (url: string, options?: RequestOptions) =>
    fetchWithInterceptor(url, { ...options, method: 'GET' }),

  post: (url: string, data?: any, options?: RequestOptions) =>
    fetchWithInterceptor(url, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    }),

  put: (url: string, data?: any, options?: RequestOptions) =>
    fetchWithInterceptor(url, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    }),

  patch: (url: string, data?: any, options?: RequestOptions) =>
    fetchWithInterceptor(url, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    }),

  delete: (url: string, options?: RequestOptions) =>
    fetchWithInterceptor(url, { ...options, method: 'DELETE' }),
};

export default api;
