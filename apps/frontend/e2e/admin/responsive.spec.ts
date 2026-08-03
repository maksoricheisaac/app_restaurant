import { test, expect } from '@playwright/test';
import { VIEWPORTS, collectPageErrors } from '../helpers';

/**
 * Tests responsive — mobile, tablette, desktop.
 * Vérifie que l'interface n'est pas cassée sur les petits écrans.
 */

const ADMIN_ROUTES = [
  '/admin/dashboard',
  '/admin/orders',
  '/admin/kitchen',
  '/admin/reservations',
  '/admin/menu',
  '/admin/tables',
];

const PUBLIC_ROUTES = [
  '/',
  '/contact',
];

test.describe('Responsive — Mobile (375px)', () => {
  test.use({ viewport: VIEWPORTS.mobile });

  for (const route of PUBLIC_ROUTES) {
    test(`${route} — mobile : pas de scroll horizontal`, async ({ page }) => {
      const errors = collectPageErrors(page);
      await page.goto(route);
      await expect(page.getByRole('main')).toBeVisible({ timeout: 8_000 });

      // Vérifier l'absence de scroll horizontal (layout cassé)
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = VIEWPORTS.mobile.width;
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px de tolérance

      expect(errors).toHaveLength(0);
    });
  }

  for (const route of ADMIN_ROUTES) {
    test(`${route} — mobile : redirect ou page stable`, async ({ page }) => {
      await page.goto(route);
      // Sans auth → redirect (acceptable), avec auth → page stable
      await page.waitForTimeout(2_000);
      const url = page.url();
      expect(url).toMatch(/\/(auth\/login|pending-invite|admin)/);
    });
  }
});

test.describe('Responsive — Tablette (768px)', () => {
  test.use({ viewport: VIEWPORTS.tablet });

  for (const route of PUBLIC_ROUTES) {
    test(`${route} — tablette : pas de débordement`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole('main')).toBeVisible({ timeout: 8_000 });

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(VIEWPORTS.tablet.width + 5);
    });
  }
});

test.describe('Responsive — Desktop (1440px)', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('landing page desktop s\'affiche correctement', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
    expect(errors).toHaveLength(0);
  });
});
