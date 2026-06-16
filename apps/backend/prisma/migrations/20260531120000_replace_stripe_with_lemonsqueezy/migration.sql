-- Migration: Replace Stripe IDs with Lemon Squeezy IDs
-- Renames the two Stripe tracking columns on Tenant to their Lemon Squeezy equivalents.
-- Drops the old unique indexes and recreates them under the new names.
-- Data is preserved; no rows are deleted or modified.

ALTER TABLE "Tenant" RENAME COLUMN "stripeCustomerId" TO "lemonSqueezyCustomerId";
ALTER TABLE "Tenant" RENAME COLUMN "stripeSubscriptionId" TO "lemonSqueezySubscriptionId";

-- Prisma names unique constraint indexes as "<Table>_<field>_key"
DROP INDEX IF EXISTS "Tenant_stripeCustomerId_key";
DROP INDEX IF EXISTS "Tenant_stripeSubscriptionId_key";

CREATE UNIQUE INDEX "Tenant_lemonSqueezyCustomerId_key"     ON "Tenant"("lemonSqueezyCustomerId");
CREATE UNIQUE INDEX "Tenant_lemonSqueezySubscriptionId_key" ON "Tenant"("lemonSqueezySubscriptionId");
