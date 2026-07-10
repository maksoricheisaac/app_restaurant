import { test, expect } from '@playwright/test';
import { loginAs, waitForToast } from '../fixtures';

test.describe('Auth — Login / Logout', () => {
  test('login avec credentials invalides affiche une erreur', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('nobody@invalid.com');
    await page.getByLabel(/mot de passe/i).fill('wrongpassword');
    await page.getByRole('button', { name: /connexion/i }).click();

    // Message d'erreur visible — ne pas rediriger
    await expect(page.getByRole('alert').or(page.getByText(/identifiant|invalide|incorrect/i))).toBeVisible({
      timeout: 5_000,
    });
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test('login sans email montre une validation', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: /connexion/i }).click();

    // HTML5 validation ou validation Zod
    const emailInput = page.getByLabel(/email/i);
    const validationText = page.getByText(/email.*requis|obligatoire/i);
    const hasValidationText = await validationText.isVisible().catch(() => false);
    if (!hasValidationText) {
      await expect(emailInput).toBeFocused();
    }
  });

  test('accès /admin/dashboard sans auth redirige vers /auth/login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForURL('**/auth/login**', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('accès /super-admin sans auth redirige vers login', async ({ page }) => {
    await page.goto('/super-admin/dashboard');
    await page.waitForURL('**/auth/login**', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Auth — Register', () => {
  test('page register se charge correctement', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page).toHaveURL(/\/auth\/register/);
    // Le formulaire d'onboarding doit être visible
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Auth — Routes publiques', () => {
  test('landing page accessible sans auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('page pricing accessible sans auth', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
