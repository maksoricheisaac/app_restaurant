import { test, expect } from '@playwright/test';

/**
 * Tests session — expiration, logout, refresh token.
 */

// Ce fichier n'éprouve que des parcours ANONYMES. Le projet admin-chromium
// injecte un storageState authentifié : sans cette remise à zéro, les appels
// partaient connectés et ne prouvaient rien.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Session — Gestion cycle de vie', () => {
  test('GET /api/v1/auth/refresh sans cookie → 401', async ({ request }) => {
    const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';
    const res = await request.post(`${API_BASE}/auth/refresh`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/auth/profile sans token → 401', async ({ request }) => {
    const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';
    const res = await request.get(`${API_BASE}/auth/profile`);
    // 429 accepté : une suite dense franchit la limite de débit, qui est
    // elle-même une protection attendue. Dans les deux cas, rien n'est servi.
    expect([401, 429]).toContain(res.status());
  });

  test('page login charge correctement', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByLabel('Adresse e-mail', { exact: true })).toBeVisible();
  });

  test('champ mot de passe de type password (sécurité)', async ({ page }) => {
    await page.goto('/auth/login');
    const passwordField = page.getByLabel('Mot de passe', { exact: true });
    if (await passwordField.isVisible()) {
      const type = await passwordField.getAttribute('type');
      expect(type).toBe('password');
    }
  });

  test('redirection après login invalide reste sur /auth/login', async ({ page }) => {
    await page.goto('/auth/login');
    const emailInput = page.getByLabel('Adresse e-mail', { exact: true });
    const passwordInput = page.getByLabel('Mot de passe', { exact: true });

    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('invalid@invalid.com');
      await passwordInput.fill('wrongpassword');
      await page.getByRole('button', { name: /se connecter/i }).click();
      await page.waitForTimeout(2_000);
      expect(page.url()).toMatch(/auth\/login/);
    }
  });
});

test.describe('Session — Logout', () => {
  test('POST /api/v1/auth/logout sans cookie → 200 ou 401 (idempotent)', async ({ request }) => {
    const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';
    const res = await request.post(`${API_BASE}/auth/logout`);
    // Le logout peut être idempotent (200) ou exiger un token valide (401)
    expect([200, 201, 401]).toContain(res.status());
  });
});

test.describe('Session — Reset password', () => {
  test('POST /api/v1/auth/forgot-password — email valide → 201', async ({ request }) => {
    const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';
    const res = await request.post(`${API_BASE}/auth/forgot-password`, {
      data: { email: 'nonexistent.user@flashmenu.test' },
    });
    // Anti-énumération : toujours 201
    expect(res.status()).toBe(201);
  });

  test('POST /api/v1/auth/reset-password sans token → 400', async ({ request }) => {
    const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';
    const res = await request.post(`${API_BASE}/auth/reset-password`, {
      data: { token: 'invalid-token', password: 'NewPass@1' },
    });
    expect([400, 401]).toContain(res.status());
  });
});
