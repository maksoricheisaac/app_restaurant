-- Migration: replace_lemonsqueezy_with_generic_payment_fields
-- Lemon Squeezy est abandonné comme fournisseur de paiement. Les colonnes
-- sont renommées (pas droppées) pour préserver les données existantes, et
-- une colonne paymentProvider est ajoutée pour tracer quel fournisseur a
-- créé l'abonnement (utile une fois plusieurs fournisseurs disponibles).
--
-- Les anciens index uniques "plein" sur slug/paymentCustomerId/
-- paymentSubscriptionId sont supprimés ici : ils sont remplacés par des
-- index uniques PARTIELS (WHERE "deletedAt" IS NULL) dans la migration
-- suivante (add_tenant_soft_delete_partial_unique_constraints), pour que
-- les tenants soft-deleted libèrent leur slug/leurs identifiants de
-- paiement au lieu de les squatter indéfiniment.

ALTER TABLE "Tenant" RENAME COLUMN "lemonSqueezyCustomerId" TO "paymentCustomerId";
ALTER TABLE "Tenant" RENAME COLUMN "lemonSqueezySubscriptionId" TO "paymentSubscriptionId";
ALTER TABLE "Tenant" ADD COLUMN "paymentProvider" TEXT;

DROP INDEX "Tenant_lemonSqueezyCustomerId_key";
DROP INDEX "Tenant_lemonSqueezySubscriptionId_key";
DROP INDEX "Tenant_slug_key";
