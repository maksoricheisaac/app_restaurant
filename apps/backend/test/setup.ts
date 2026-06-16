/**
 * E2E test global setup.
 *
 * Applique les migrations Prisma et seed de test sur la TEST_DATABASE_URL.
 * Exécuté une seule fois avant tous les tests E2E.
 *
 * Usage :
 *   pnpm test:e2e:prepare   — migration + seed uniquement
 *   pnpm test:e2e           — prepare + jest (recommandé)
 *   pnpm test:e2e:reset     — reset total DB de test
 */
import { execSync } from 'child_process';
import * as path from 'path';

export default async function globalSetup() {
  const testDb = process.env.TEST_DATABASE_URL;

  if (!testDb) {
    console.warn(
      '\n[E2E] TEST_DATABASE_URL is not set.\n' +
        '      E2E tests require an isolated PostgreSQL database.\n' +
        '      Add TEST_DATABASE_URL to .env and run: pnpm test:e2e\n',
    );
    process.env.SKIP_E2E = '1';
    return;
  }

  // Override DATABASE_URL pour tous les tests E2E
  process.env.DATABASE_URL = testDb;
  process.env.JWT_SECRET =
    process.env.TEST_JWT_SECRET ?? 'e2e-test-secret-at-least-32-characters!!';
  process.env.FRONTEND_URL = 'http://localhost:4000';
  process.env.NODE_ENV = 'test';

  const rootDir = path.resolve(__dirname, '..');
  const env = { ...process.env, DATABASE_URL: testDb };

  console.log('\n[E2E] Preparing test database...');
  console.log(`[E2E] DB: ${testDb.replace(/:([^@]+)@/, ':***@')}`);

  try {
    // 1. Appliquer les migrations (idempotent — ne recrée pas si déjà à jour)
    console.log('[E2E] Running migrations...');
    execSync('npx prisma migrate deploy', {
      cwd: rootDir,
      env,
      stdio: 'inherit',
    });

    // 2. Seeder les données de test
    console.log('[E2E] Seeding test data...');
    execSync('npx ts-node --project tsconfig.json prisma/seed-test.ts', {
      cwd: rootDir,
      env,
      stdio: 'inherit',
    });

    console.log('[E2E] Test database ready.\n');
  } catch (err) {
    console.error('[E2E] Failed to prepare test database:', err);
    throw err;
  }
}
