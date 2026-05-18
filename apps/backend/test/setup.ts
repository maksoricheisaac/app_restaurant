/**
 * E2E test global setup.
 *
 * Validates required environment variables before running E2E tests.
 * E2E tests require a real (isolated) PostgreSQL database.
 *
 * Usage:
 *   TEST_DATABASE_URL="postgresql://..." pnpm test:e2e
 *
 * For CI, spin up a Postgres service and set TEST_DATABASE_URL.
 * The test DB is reset between runs via `prisma migrate reset --force`.
 */
export default async function globalSetup() {
  const testDb = process.env.TEST_DATABASE_URL;

  if (!testDb) {
    console.warn(
      '\n[E2E] TEST_DATABASE_URL is not set.\n' +
      '      E2E tests require an isolated PostgreSQL database.\n' +
      '      Set TEST_DATABASE_URL and run: pnpm test:e2e\n',
    );
    // Allow E2E tests to be skipped gracefully in environments without a DB
    process.env.SKIP_E2E = '1';
    return;
  }

  // Override DATABASE_URL for all E2E tests
  process.env.DATABASE_URL = testDb;
  process.env.JWT_SECRET = process.env.TEST_JWT_SECRET ?? 'e2e-test-secret-at-least-32-characters';
  process.env.FRONTEND_URL = 'http://localhost:4000';
  process.env.NODE_ENV = 'test';

  console.log('[E2E] Test environment ready.');
  console.log(`[E2E] Database: ${testDb.replace(/:([^@]+)@/, ':***@')}`);
}
