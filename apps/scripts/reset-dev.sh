#!/usr/bin/env bash
# reset-dev.sh — Full dev database reset (drop + recreate + seed)
# WARNING: DESTRUCTIVE. Development only.
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "$0")/../backend" && pwd)"
cd "$BACKEND_DIR"

if [ "${NODE_ENV:-}" = "production" ]; then
  echo "[ERROR] Reset script refuses to run in NODE_ENV=production"
  exit 1
fi

echo ">>> [DESTRUCTIVE] Full dev database reset"
read -r -p "This will DROP all data. Continue? (y/N) " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

echo "[1/3] Resetting database (migrate reset)..."
pnpm exec prisma migrate reset --force

echo "[2/3] Seeding admin account..."
pnpm exec ts-node -r tsconfig-paths/register prisma/seed-admin.ts

echo "[3/3] Done."
