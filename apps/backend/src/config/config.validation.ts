import { z } from 'zod';

/**
 * Validates all required environment variables at startup.
 * If any required variable is missing or malformed, the process exits immediately.
 * This prevents half-started services with silent misconfiguration.
 */
const envSchema = z.object({
  // ── Core ─────────────────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .startsWith(
      'postgresql://',
      'DATABASE_URL must be a PostgreSQL connection string',
    ),

  // ── JWT ───────────────────────────────────────────────────────────────────
  JWT_SECRET: z
    .string()
    .min(
      32,
      'JWT_SECRET must be at least 32 characters (use 64-byte hex for production)',
    ),

  // ── Frontend ──────────────────────────────────────────────────────────────
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),

  // ── SMTP (optional — service degrades gracefully when absent) ─────────────
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // ── Menu session token ────────────────────────────────────────────────────
  // Distinct from JWT_SECRET. Falls back to JWT_SECRET in dev if absent.
  MENU_SESSION_SECRET: z.string().min(16).optional(),

  // ── Redis (optional — throttler degrades to in-memory when absent) ────────
  REDIS_URL: z.string().url().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // ── Vercel Blob ───────────────────────────────────────────────────────────
  BLOB_READ_WRITE_TOKEN: z
    .string()
    .min(1, 'BLOB_READ_WRITE_TOKEN is required for image storage')
    .optional(), // optional in dev — BlobService degrades gracefully when absent
});

export type AppConfig = z.infer<typeof envSchema>;

export function validateConfig(config: Record<string, unknown>): AppConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error(
      '\n[CONFIG ERROR] Missing or invalid environment variables:\n',
    );
    console.error(errors);
    console.error(
      '\nCopy backend/.env.example to backend/.env and fill in the required values.\n',
    );
    process.exit(1);
  }

  return result.data;
}
