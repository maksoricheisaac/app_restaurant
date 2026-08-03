import { test, expect } from '@playwright/test';

/**
 * Tests menu public — accès client sans authentification.
 */
test.describe('Menu public — QR Code flow', () => {
  test('la carte publique est accessible', async ({ page }) => {
    // Une seule carte publique, à une adresse fixe.
    await page.goto('/menu');

    // La page doit se charger (même si le restaurant n'est pas configuré)
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('page de suivi est accessible avec un UUID factice', async ({ page }) => {
    await page.goto('/menu/track/00000000-0000-0000-0000-000000000000');
    // Ne doit pas planter — afficher "commande introuvable" ou loader
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Menu public — Navigation', () => {

  test('page contact se charge', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('main')).toBeVisible();
  });
});
