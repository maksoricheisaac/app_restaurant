#!/usr/bin/env bash
# migrate-prod.sh — Production-safe Prisma migration
# Usage: ./scripts/migrate-prod.sh
# Requires: DATABASE_URL in environment or .env file
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "$0")/../backend" && pwd)"
cd "$BACKEND_DIR"

echo ">>> Flash Menu — Production Migration"
echo ">>> Target: $DATABASE_URL"
echo ""

# Sanity checks
if [ -z "${DATABASE_URL:-}" ]; then
  echo "[ERROR] DATABASE_URL is not set"
  exit 1
fi

if echo "$DATABASE_URL" | grep -q "localhost\|127.0.0.1"; then
  echo "[WARN] DATABASE_URL points to localhost — are you sure this is production?"
  read -r -p "Continue? (y/N) " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

echo "[1/3] Generating Prisma client..."
pnpm exec prisma generate

echo "[2/3] Running pending migrations (deploy mode — no schema drift, no interactive prompts)..."
# prisma migrate deploy: applies pending migrations, never modifies the schema, safe for production
pnpm exec prisma migrate deploy

echo "[3/3] Done."
echo ""
echo ">>> Migration complete. Restart backend services to pick up the new schema."
