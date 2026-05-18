#!/usr/bin/env bash
# seed-dev.sh — Seed development database
# WARNING: Only run in development. Never against production.
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "$0")/../backend" && pwd)"
cd "$BACKEND_DIR"

if [ "${NODE_ENV:-}" = "production" ]; then
  echo "[ERROR] Seed script refuses to run in NODE_ENV=production"
  exit 1
fi

echo ">>> Seeding development database..."
pnpm exec ts-node -r tsconfig-paths/register prisma/seed-admin.ts
echo ">>> Seed complete."
