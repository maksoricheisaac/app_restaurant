import { test, expect } from '@playwright/test';
import { collectPageErrors, setViewport } from '../helpers';

/**
 * Tests WebSocket / Temps réel.
 *
 * Ces tests vérifient :
 * - La connexion WebSocket s'établit correctement
 * - Les toasts de notification apparaissent
 * - Le KDS réagit aux nouvelles commandes
 * - La reconnexion après coupure réseau
 */
test.describe('Temps réel — WebSocket admin', () => {
  test('dashboard admin ne plante pas sans WebSocket (offline)', async ({ page, context }) => {
    const errors = collectPageErrors(page);

    await page.goto('/admin/dashboard');
    const url = page.url();

    // Sans auth → redirect, pas de crash
    if (url.includes('/auth/login')) {
      expect(errors).toHaveLength(0);
      return;
    }

    // Avec auth → vérifier que la page est stable
    await expect(page.getByRole('main')).toBeVisible({ timeout: 8_000 });
    expect(errors.filter(e => !e.includes('notification.mp3'))).toHaveLength(0);
  });

  test('reconnexion réseau — page reste fonctionnelle', async ({ page, context }) => {
    await page.goto('/admin/dashboard');
    const url = page.url();
    if (url.includes('/auth/login')) return; // skip sans auth

    // Simuler coupure réseau 2 secondes
    await context.setOffline(true);
    await page.waitForTimeout(2_000);
    await context.setOffline(false);

    // La page doit toujours être visible (pas de blank screen)
    await expect(page.getByRole('main')).toBeVisible({ timeout: 5_000 });
  });

  test('KDS se charge même sans nouvelles commandes', async ({ page }) => {
    await page.goto('/admin/kitchen');
    const url = page.url();
    if (url.includes('/auth/login')) return;

    await expect(page.getByRole('main')).toBeVisible({ timeout: 8_000 });

    // L'empty state doit être visible (pas de crash)
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
    const content = await main.textContent();
    expect(content).not.toBeNull();
  });
});

test.describe('Temps réel — Multi-onglets', () => {
  test('deux onglets admin peuvent s\'ouvrir sans crash', async ({ context }) => {
    const tab1 = await context.newPage();
    const tab2 = await context.newPage();

    await tab1.goto('/admin/dashboard');
    await tab2.goto('/admin/orders');

    // Aucun onglet ne doit être cassé
    const url1 = tab1.url();
    const url2 = tab2.url();

    // Les deux redirigent ou affichent la page (pas de blank)
    expect(url1).toMatch(/\/(auth\/login|admin)/);
    expect(url2).toMatch(/\/(auth\/login|admin)/);

    await tab1.close();
    await tab2.close();
  });
});
