-- Migration: recipe_tenant_id
-- Recipe était le seul modèle métier tenant-owned sans colonne tenantId
-- directe, forçant une jointure imbriquée via menuItem pour tout scoping
-- multi-tenant. On ajoute la colonne, on la backfill depuis
-- MenuItem.tenantId, puis on la rend obligatoire.

ALTER TABLE "Recipe" ADD COLUMN "tenantId" TEXT;

UPDATE "Recipe" r
SET "tenantId" = mi."tenantId"
FROM "MenuItem" mi
WHERE mi.id = r."menuItemId";

ALTER TABLE "Recipe" ALTER COLUMN "tenantId" SET NOT NULL;

CREATE INDEX "Recipe_tenantId_idx" ON "Recipe"("tenantId");

ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
