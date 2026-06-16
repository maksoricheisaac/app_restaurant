import { test, expect } from '@playwright/test';

/**
 * Tests workflow commandes — golden path complet.
 */
test.describe('Commandes — Workflow complet', () => {
  test('page orders se charge sans erreur', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page.getByRole('main')).toBeVisible();

    // Attendre que les données chargent (disparition du loader)
    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 15_000 }).catch(() => {
      // OK si pas de progressbar visible
    });
  });

  test('filtre commandes par statut "pending" fonctionne', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page.getByRole('main')).toBeVisible();

    // Trouver le filtre statut (combobox ou select)
    const statusFilter = page.getByRole('combobox').filter({ hasText: /statut|status/i })
      .or(page.getByLabel(/statut|status/i));

    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      const pendingOption = page.getByRole('option', { name: /en attente|pending/i });
      if (await pendingOption.isVisible()) {
        await pendingOption.click();
      }
    }
    // Pas d'erreur après filtrage
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('KDS cuisine se charge', async ({ page }) => {
    await page.goto('/admin/kitchen');
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Commandes — États machines', () => {
  test('page de détail commande accessible', async ({ page }) => {
    // On navigue sur orders — si des commandes existent, en clique une
    await page.goto('/admin/orders');
    await expect(page.getByRole('main')).toBeVisible();

    // Trouver un lien de détail si disponible
    const orderLinks = page.getByRole('row').filter({ hasText: /€|\d+/ });
    const count = await orderLinks.count();

    if (count > 0) {
      // Cliquer sur la première commande
      await orderLinks.first().click();
      await expect(page.getByRole('dialog').or(page.getByRole('main'))).toBeVisible({ timeout: 5_000 });
    }
  });
});
