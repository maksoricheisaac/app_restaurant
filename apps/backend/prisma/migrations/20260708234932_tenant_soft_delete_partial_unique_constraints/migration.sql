-- Migration: tenant_soft_delete_partial_unique_constraints
-- Corrige un bug critique de l'audit : un Tenant soft-deleted (deletedAt
-- non null) squattait indéfiniment son slug et ses identifiants de
-- paiement, puisque les contraintes @unique historiques portaient sur la
-- table entière, alors que la suppression physique d'un tenant est
-- désormais interdite (voir PrismaService). Un restaurant qui ferme son
-- compte ne pouvait donc jamais se réinscrire sous le même nom, et son
-- slug/sous-domaine restait bloqué pour tout le monde.
--
-- Remplacement par des index uniques PARTIELS qui n'excluent QUE les
-- tenants actifs (deletedAt IS NULL) — un tenant soft-deleted libère son
-- slug/ses identifiants de paiement pour un futur tenant.

CREATE UNIQUE INDEX "Tenant_slug_active_key"
  ON "Tenant"("slug")
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "Tenant_paymentCustomerId_active_key"
  ON "Tenant"("paymentCustomerId")
  WHERE "deletedAt" IS NULL AND "paymentCustomerId" IS NOT NULL;

CREATE UNIQUE INDEX "Tenant_paymentSubscriptionId_active_key"
  ON "Tenant"("paymentSubscriptionId")
  WHERE "deletedAt" IS NULL AND "paymentSubscriptionId" IS NOT NULL;
