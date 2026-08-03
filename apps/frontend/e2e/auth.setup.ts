import { test as setup, expect } from '@playwright/test';
import { TEST_CREDENTIALS } from './fixtures';

/**
 * Setup : authentification de l'utilisateur owner une seule fois.
 * Le storageState résultant est réutilisé par tous les tests admin.
 */
setup('authenticate as owner', async ({ page }) => {
  await page.goto('/auth/login');

  await page.getByLabel('Adresse e-mail', { exact: true }).fill(TEST_CREDENTIALS.owner.email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(TEST_CREDENTIALS.owner.password);
  await page.getByRole('button', { name: /se connecter/i }).click();

  // Attendre la redirection vers l'admin
  await page.waitForURL('**/admin/**', { timeout: 15_000 });
  await expect(page).toHaveURL(/\/admin/);

  // Sauvegarder l'état d'authentification (cookies httpOnly inclus)
  await page.context().storageState({ path: 'e2e/.auth/admin.json' });
});
