import { Page, expect, BrowserContext } from '@playwright/test';

// ─── API helpers ─────────────────────────────────────────────────────────────

export const API_BASE = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';

export async function apiRequest(
  page: Page,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  const res = await page.request[method.toLowerCase() as 'get' | 'post' | 'patch' | 'delete'](
    `${API_BASE}${path}`,
    body ? { data: body } : undefined,
  );
  return { status: res.status(), body: await res.json().catch(() => null) };
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.getByLabel('Adresse e-mail', { exact: true }).fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
}

export async function waitForAdminDashboard(page: Page) {
  await page.waitForURL('**/admin/**', { timeout: 15_000 });
  await expect(page.getByRole('main')).toBeVisible();
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export async function waitForToast(page: Page, text: string | RegExp, timeout = 6_000) {
  const toast = page.locator('[data-sonner-toast]').filter({ hasText: text });
  await expect(toast).toBeVisible({ timeout });
}

export async function waitForLoadingDone(page: Page) {
  // Attend que les spinners/skeletons disparaissent
  await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 10_000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
}

export async function clickAndWait(page: Page, locator: Parameters<Page['getByRole']>[0], name: string) {
  await page.getByRole(locator, { name }).click();
  await page.waitForTimeout(300); // animation
}

// ─── Data factories ───────────────────────────────────────────────────────────

export function makeReservationData(overrides: Partial<{
  date: string;
  time: string;
  guests: number;
  customerName: string;
  email: string;
}> = {}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    date: tomorrow.toISOString().split('T')[0],
    time: '19:00',
    guests: 2,
    customerName: 'Test Customer',
    email: 'test.customer@e2e.test',
    ...overrides,
  };
}

export function makeOrderItems() {
  return [{ quantity: 1 }]; // items factices pour les tests
}

// ─── Viewport helpers ─────────────────────────────────────────────────────────

export const VIEWPORTS = {
  mobile:  { width: 375, height: 812 },
  tablet:  { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
} as const;

export async function setViewport(page: Page, viewport: keyof typeof VIEWPORTS) {
  await page.setViewportSize(VIEWPORTS[viewport]);
}

// ─── Multi-tab helpers ────────────────────────────────────────────────────────

export async function openNewTab(context: BrowserContext, url: string): Promise<Page> {
  const tab = await context.newPage();
  await tab.goto(url);
  return tab;
}

// ─── Network helpers ─────────────────────────────────────────────────────────

/**
 * Simule une perte réseau temporaire puis rétablit.
 */
export async function simulateNetworkDropAndRestore(page: Page, durationMs = 2_000) {
  await page.context().setOffline(true);
  await page.waitForTimeout(durationMs);
  await page.context().setOffline(false);
}

/**
 * Vérifie qu'aucune erreur JS critique n'a été levée sur la page.
 */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    // Ignorer les erreurs connues non-critiques
    if (!err.message.includes('ResizeObserver') && !err.message.includes('Non-Error')) {
      errors.push(err.message);
    }
  });
  return errors;
}
