import { test, expect } from '@playwright/test';
import { API_BASE } from '../helpers';

/**
 * Tests RBAC — Vérification que les permissions sont appliquées correctement
 * selon le rôle de l'utilisateur authentifié.
 *
 * Ces tests utilisent l'API directement pour tester le backend RBAC.
 * Les tests UI nécessitent des storageStates par rôle (à configurer).
 */
test.describe('RBAC — API layer', () => {
  test.describe('Routes requérant owner/manager', () => {
    test('GET /api/v1/reports/metrics requiert auth', async ({ request }) => {
      const res = await request.get(`${API_BASE}/reports/metrics`);
      expect([401, 403]).toContain(res.status());
    });

    test('POST /api/v1/menu requiert auth + rôle', async ({ request }) => {
      const res = await request.post(`${API_BASE}/menu`, {
        data: { name: 'Test', price: 10, categoryId: 'fake' },
      });
      expect([401, 403]).toContain(res.status());
    });

    test('DELETE /api/v1/tables/fake-id requiert auth', async ({ request }) => {
      const res = await request.delete(`${API_BASE}/tables/fake-id`);
      expect([401, 403]).toContain(res.status());
    });

    test('GET /api/v1/permissions requiert auth', async ({ request }) => {
      const res = await request.get(`${API_BASE}/permissions`);
      expect([401, 403]).toContain(res.status());
    });
  });

  test.describe('Routes accessibles sans auth (public)', () => {
    test('GET /api/v1/health/live', async ({ request }) => {
      const res = await request.get(`${API_BASE}/health/live`);
      expect(res.status()).toBe(200);
    });

    test('GET /api/v1/public-menu/:slug — retourne 404 pour tenant inconnu', async ({ request }) => {
      const res = await request.get(`${API_BASE}/public-menu/tenant-qui-nexiste-pas-xyz123`);
      expect(res.status()).toBe(404);
    });
  });

  test.describe('Validation des inputs (sans auth)', () => {
    test('POST /api/v1/auth/login — email invalide → 400/401', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/login`, {
        data: { email: 'not-an-email', password: 'test' },
      });
      expect([400, 401]).toContain(res.status());
    });

    test('POST /api/v1/auth/login — body vide → 400/401', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/login`, { data: {} });
      expect([400, 401]).toContain(res.status());
    });

    test('POST /api/v1/onboarding/initiate — mot de passe trop faible → 400', async ({ request }) => {
      const res = await request.post(`${API_BASE}/onboarding/initiate`, {
        data: { firstName: 'Test', lastName: 'User', email: 'test@test.com', password: '123' },
      });
      expect(res.status()).toBe(400);
    });
  });

  test.describe('Tenant isolation — sans auth', () => {
    test('POST /api/v1/orders sans tenant header → 401/403', async ({ request }) => {
      const res = await request.post(`${API_BASE}/orders`, {
        data: { type: 'dine_in', items: [{ name: 'Test', quantity: 1, price: 10 }] },
      });
      expect([401, 403]).toContain(res.status());
    });

    test('GET /api/v1/reservations sans auth → 401/403', async ({ request }) => {
      const res = await request.get(`${API_BASE}/reservations`, {
        headers: { 'x-tenant-id': 'tenant-qui-nexiste-pas' },
      });
      expect([401, 403, 404]).toContain(res.status());
    });
  });
});

test.describe('RBAC — UI layer (admin connecté)', () => {
  test('dashboard admin charge sans erreur JS', async ({ page }) => {
    const errors = [] as string[];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/admin/dashboard');
    // Sans auth → redirect vers login
    await page.waitForURL(/\/(auth\/login|admin)/, { timeout: 8_000 });

    expect(errors.filter(e => !e.includes('hydration'))).toHaveLength(0);
  });

  test('accès /admin/* sans session → redirect /auth/login', async ({ page }) => {
    const protectedRoutes = [
      '/admin/dashboard',
      '/admin/orders',
      '/admin/kitchen',
      '/admin/reports',
      '/admin/settings',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForURL(/\/(auth\/login|pending-invite)/, { timeout: 6_000 });
      expect(page.url()).toMatch(/\/(auth\/login|pending-invite)/);
    }
  });
});
