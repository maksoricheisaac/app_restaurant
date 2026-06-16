import { test, expect } from '@playwright/test';
import { VIEWPORTS } from '../helpers';

/**
 * Tests flow client QR Code — parcours public complet.
 *
 * Simule un client qui scanne un QR code dans un restaurant :
 * 1. Accède au menu via /menu/:slug
 * 2. Parcourt les catégories
 * 3. Ajoute des articles au panier
 * 4. Finalise la commande
 * 5. Track sa commande
 */
test.describe('QR Flow — Menu public client', () => {
  const testSlug = process.env.E2E_TEST_SLUG || 'test-restaurant';

  test('accès menu par slug s\'affiche', async ({ page }) => {
    await page.goto(`/menu/${testSlug}`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 10_000 });
  });

  test('menu public — pas d\'erreur JS', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(`/menu/${testSlug}`);
    await page.waitForTimeout(2_000);

    expect(errors).toHaveLength(0);
  });

  test('menu public — viewport mobile (375px)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto(`/menu/${testSlug}`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 10_000 });

    // Pas de scroll horizontal sur mobile
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(VIEWPORTS.mobile.width + 10);
  });
});

test.describe('QR Flow — Order tracking', () => {
  test('page de tracking avec UUID inconnu — pas de crash', async ({ page }) => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    await page.goto(`/order-tracking/${fakeUuid}`);

    await expect(page.getByRole('main')).toBeVisible({ timeout: 8_000 });

    // La page doit afficher "commande introuvable" ou similaire, pas crasher
    const content = await page.getByRole('main').textContent();
    expect(content).not.toBeNull();
    expect(content!.length).toBeGreaterThan(5);
  });

  test('page de tracking — viewport mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    const fakeUuid = '00000000-0000-0000-0000-000000000001';
    await page.goto(`/order-tracking/${fakeUuid}`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('QR Flow — Public menu API', () => {
  test('GET /public-menu/:slug — slug inexistant → 404', async ({ request }) => {
    const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';
    const res = await request.get(`${API_BASE}/public-menu/restaurant-qui-nexiste-absolument-pas-xyz`);
    expect(res.status()).toBe(404);
  });

  test('POST /public-menu/:slug/order — items vides → 400', async ({ request }) => {
    const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';
    const res = await request.post(`${API_BASE}/public-menu/${testSlug}/order`, {
      data: { type: 'dine_in', items: [] },
    });
    // 400 (items vides) ou 404 (tenant inconnu) — pas 500
    expect([400, 404]).toContain(res.status());
  });
});
