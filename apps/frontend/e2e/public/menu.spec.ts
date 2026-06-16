import { test, expect } from '@playwright/test';

/**
 * Tests menu public — accès client sans authentification.
 */
test.describe('Menu public — QR Code flow', () => {
  test('page menu par slug est accessible', async ({ page }) => {
    // Format : /menu/{slug}
    // En test : utiliser le slug du tenant de test
    const testSlug = process.env.E2E_TEST_SLUG || 'test-restaurant';
    await page.goto(`/menu/${testSlug}`);

    // La page doit se charger (même si le restaurant n'est pas configuré)
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('page order-tracking est accessible avec un UUID factice', async ({ page }) => {
    await page.goto('/order-tracking/00000000-0000-0000-0000-000000000000');
    // Ne doit pas planter — afficher "commande introuvable" ou loader
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Menu public — Navigation', () => {
  test('page pricing charge les plans', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('main')).toBeVisible();
    // Au moins un plan affiché
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('page contact se charge', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('main')).toBeVisible();
  });
});
