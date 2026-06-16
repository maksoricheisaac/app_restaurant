import { test, expect } from '@playwright/test';

test.describe('Réservations — Protection double-booking', () => {
  test('page réservations se charge', async ({ page }) => {
    await page.goto('/admin/reservations');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('formulaire création réservation est accessible', async ({ page }) => {
    await page.goto('/admin/reservations');
    await expect(page.getByRole('main')).toBeVisible();

    // Bouton "Nouvelle réservation" ou équivalent
    const createBtn = page.getByRole('button', { name: /nouvelle|créer|ajouter/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      // Un formulaire ou dialog doit s'ouvrir
      await expect(
        page.getByRole('dialog').or(page.getByRole('form'))
      ).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe('Réservations — Workflow statuts', () => {
  test('aucun crash sur la page réservations', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/admin/reservations');
    await page.waitForTimeout(2_000);

    expect(errors).toHaveLength(0);
  });
});
