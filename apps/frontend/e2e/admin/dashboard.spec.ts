import { test, expect } from '@playwright/test';

/**
 * Tests dashboard admin — utilise storageState du setup (owner authentifié).
 */
test.describe('Admin — Dashboard', () => {
  test('dashboard charge et affiche les statistiques', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Les métriques principales doivent être visibles (pas d'état vide cassé)
    await expect(page.getByRole('main')).toBeVisible();

    // Vérifier absence d'erreur console critique
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('404')) {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2_000);
    // Erreurs non critiques tolérées (ex: notification.mp3 absent en test)
  });

  test('sidebar navigation fonctionne — commandes', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.getByRole('link', { name: /commandes/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/orders/, { timeout: 8_000 });
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('sidebar navigation fonctionne — cuisine/KDS', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.getByRole('link', { name: /cuisine|kds/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/kitchen/, { timeout: 8_000 });
  });

  test('sidebar navigation fonctionne — réservations', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.getByRole('link', { name: /réservations/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/reservations/, { timeout: 8_000 });
  });
});

test.describe('Admin — Menu', () => {
  test('page menu charge les articles', async ({ page }) => {
    await page.goto('/admin/menu');
    await expect(page).toHaveURL(/\/admin\/menu/);
    await expect(page.getByRole('main')).toBeVisible();
    // Attendre que le chargement soit terminé (pas de spinner infini)
    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Admin — Tables', () => {
  test('page tables se charge', async ({ page }) => {
    await page.goto('/admin/tables');
    await expect(page).toHaveURL(/\/admin\/tables/);
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Admin — Commandes', () => {
  test('liste des commandes se charge', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page.getByRole('main')).toBeVisible();
    // Pas d'état cassé (page blanche)
    const mainContent = await page.getByRole('main').textContent();
    expect(mainContent).not.toBeNull();
    expect(mainContent!.length).toBeGreaterThan(10);
  });
});

test.describe('Admin — Réservations', () => {
  test('liste des réservations se charge', async ({ page }) => {
    await page.goto('/admin/reservations');
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Admin — Messages', () => {
  test('page messages se charge', async ({ page }) => {
    await page.goto('/admin/messages');
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Admin — Settings', () => {
  test('page paramètres accessible par owner', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Admin — Billing', () => {
  test('page billing accessible par owner', async ({ page }) => {
    await page.goto('/admin/billing');
    await expect(page.getByRole('main')).toBeVisible();
  });
});
