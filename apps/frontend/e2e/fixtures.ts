import { test as base, expect, Page } from '@playwright/test';

// ─── Credentials de test ──────────────────────────────────────────────────────
// Ces identifiants doivent exister en base de test (seed ou fixtures)
export const TEST_CREDENTIALS = {
  owner:   { email: 'owner@test-restaurant.com',   password: 'TestPass@1', role: 'owner' },
  manager: { email: 'manager@test-restaurant.com', password: 'TestPass@1', role: 'manager' },
  waiter:  { email: 'waiter@test-restaurant.com',  password: 'TestPass@1', role: 'waiter' },
  chef:    { email: 'chef@test-restaurant.com',    password: 'TestPass@1', role: 'head_chef' },
  cashier: { email: 'cashier@test-restaurant.com', password: 'TestPass@1', role: 'cashier' },
};

export const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';

// ─── Helpers de navigation ───────────────────────────────────────────────────

export async function loginAs(page: Page, role: keyof typeof TEST_CREDENTIALS) {
  const creds = TEST_CREDENTIALS[role];
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill(creds.email);
  await page.getByLabel(/mot de passe/i).fill(creds.password);
  await page.getByRole('button', { name: /connexion/i }).click();
  await page.waitForURL('**/admin/**', { timeout: 10_000 });
}

export async function expectToBeOnAdminDashboard(page: Page) {
  await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10_000 });
}

export async function waitForToast(page: Page, text: string | RegExp) {
  await expect(page.getByRole('status').filter({ hasText: text })).toBeVisible({
    timeout: 5_000,
  });
}

// ─── Fixtures custom ─────────────────────────────────────────────────────────

type FlashMenuFixtures = {
  adminPage: Page; // page pré-authentifiée en tant que owner
};

export const test = base.extend<FlashMenuFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/admin.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
