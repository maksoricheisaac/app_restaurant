import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright — Flash Menu V1
 *
 * Setup : pnpm add -D @playwright/test && pnpm exec playwright install
 * Run   : pnpm exec playwright test
 * UI    : pnpm exec playwright test --ui
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Passer les cookies httpOnly sur chaque requête
    extraHTTPHeaders: {
      'Accept-Language': 'fr-FR',
    },
  },

  projects: [
    // Setup : authentification partagée (une seule fois par worker)
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // Tests admin (nécessitent l'auth setup)
    {
      name: 'admin-chromium',
      testMatch: /admin\/.*/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
    },

    // Tests publics (sans auth)
    {
      name: 'public-chromium',
      testMatch: /public\/.*/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Tests sécurité (accès non autorisés)
    {
      name: 'security',
      testMatch: /security\/.*/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:4000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
