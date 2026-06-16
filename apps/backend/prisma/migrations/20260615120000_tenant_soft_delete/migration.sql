-- Migration: 20260615120000_tenant_soft_delete
-- Ajoute le soft-delete (deletedAt) sur Tenant.
-- La suppression physique d'un tenant (et donc de tout son historique
-- métier via les relations onDelete: Cascade) est désormais interdite par
-- l'application — voir PrismaService (this.tenant.delete / deleteMany sont
-- remplacés par une fonction qui lève une erreur).

ALTER TABLE "Tenant" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "Tenant_deletedAt_idx" ON "Tenant"("deletedAt");
