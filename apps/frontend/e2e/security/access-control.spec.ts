import { test, expect } from '@playwright/test';
import { API_BASE } from '../fixtures';

/**
 * Tests de sécurité — accès sans authentification et contournement RBAC.
 * Ces tests s'exécutent SANS storageState (contexte propre, non authentifié).
 */
test.describe('Sécurité — Accès sans authentification', () => {
  test('GET /api/v1/orders exige un JWT valide', async ({ request }) => {
    const res = await request.get(`${API_BASE}/orders`);
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/v1/dashboard/stats exige un JWT valide', async ({ request }) => {
    const res = await request.get(`${API_BASE}/dashboard/stats`);
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/v1/orders exige un JWT valide', async ({ request }) => {
    const res = await request.post(`${API_BASE}/orders`, {
      data: { type: 'dine_in', items: [{ name: 'Test', quantity: 1, price: 100 }] },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/v1/reservations exige un JWT valide', async ({ request }) => {
    const res = await request.get(`${API_BASE}/reservations`);
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/v1/menu/items exige un JWT valide', async ({ request }) => {
    const res = await request.get(`${API_BASE}/menu/items`);
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/v1/reports/metrics exige un JWT valide', async ({ request }) => {
    const res = await request.get(`${API_BASE}/reports/metrics`);
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Sécurité — Routes publiques accessibles', () => {
  test('GET /api/v1/health retourne 200', async ({ request }) => {
    const res = await request.get(`${API_BASE}/health`);
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/health/live retourne 200', async ({ request }) => {
    const res = await request.get(`${API_BASE}/health/live`);
    expect(res.status()).toBe(200);
  });
});

test.describe('Sécurité — Injection prix commande', () => {
  test('POST /api/v1/public/orders avec prix manipulé est refusé ou ignoré', async ({ request }) => {
    // Un utilisateur public ne peut pas manipuler le prix — le backend recalcule
    // La route doit rejeter une charge invalide, sans jamais renvoyer de 500
    const res = await request.post(`${API_BASE}/public/orders`, {
      data: {
        items: [{ menuItemId: 'fake-id', quantity: 1, price: 0.01 }],
        type: 'dine_in',
      },
    });
    // Doit rejeter : validation en échec
    expect([400, 401, 403, 404]).toContain(res.status());
  });
});

test.describe('Sécurité — Navigation protégée', () => {
  test('/admin/dashboard sans session redirige vers la connexion', async ({ page }) => {
    // Sans cookie de session : doit rediriger vers login
    await page.goto('/admin/dashboard');
    await page.waitForURL(/\/(auth\/login|pending-invite)/, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
  });
});

test.describe('Sécurité — Validation inputs API', () => {
  test('POST /api/v1/auth/login avec email invalide retourne 400 ou 401', async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/login`, {
      data: { email: 'not-an-email', password: 'whatever' },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('POST /api/v1/auth/forgot-password avec email invalide retourne 400', async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/forgot-password`, {
      data: { email: 'notanemail' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/v1/auth/forgot-password anti-énumération (email inconnu → 201)', async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/forgot-password`, {
      data: { email: 'nonexistent@test-xyz-12345.com' },
    });
    // Anti-énumération : même réponse qu'un email existant
    expect(res.status()).toBe(201);
  });
});
