-- Plans pilotés par les données : nouvelle table Plan, source de vérité unique
-- des offres. Tenant.plan passe de l'enum figée TenantPlan à une clé texte
-- référençant Plan.key (couplage lâche, pas de FK dure).

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "monthlyPrice" INTEGER NOT NULL DEFAULT 0,
    "annualPrice" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "maxMenuItems" INTEGER NOT NULL DEFAULT -1,
    "maxTables" INTEGER NOT NULL DEFAULT -1,
    "maxStaffMembers" INTEGER NOT NULL DEFAULT -1,
    "maxMonthlyOrders" INTEGER NOT NULL DEFAULT -1,
    "features" JSONB NOT NULL DEFAULT '{}',
    "highlights" TEXT[],
    "badge" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_key_key" ON "Plan"("key");
CREATE INDEX "Plan_isActive_isPublic_idx" ON "Plan"("isActive", "isPublic");
CREATE INDEX "Plan_deletedAt_idx" ON "Plan"("deletedAt");

-- AlterTable : convertit Tenant.plan (enum TenantPlan) en TEXT sans perte de
-- données (les valeurs 'free'/'pro'/'enterprise' sont conservées telles quelles).
ALTER TABLE "Tenant" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "Tenant" ALTER COLUMN "plan" SET DATA TYPE TEXT USING "plan"::text;
ALTER TABLE "Tenant" ALTER COLUMN "plan" SET DEFAULT 'free';

-- DropEnum
DROP TYPE "TenantPlan";

-- Seed des plans par défaut (idempotent). Reproduit à l'identique les limites,
-- features et méta-marketing auparavant codés en dur dans plans.config.ts /
-- config/plans.ts. `-1` = illimité.
INSERT INTO "Plan" (
    "id","key","name","tagline","description","monthlyPrice","annualPrice","currency",
    "maxMenuItems","maxTables","maxStaffMembers","maxMonthlyOrders",
    "features","highlights","badge","isActive","isPublic","sortOrder","createdAt","updatedAt"
) VALUES
(
    gen_random_uuid(), 'free', 'Gratuit', 'Pour petits établissements',
    'Pour tester Flash Menu sans risque.', 0, 0, 'EUR',
    5, 3, 2, 10,
    '{"kds":false,"advancedReports":false,"apiAccess":false,"multiSite":false,"customBranding":false}'::jsonb,
    ARRAY['10 commandes / mois','5 articles menu','3 tables + QR codes','2 comptes staff','Dashboard de base'],
    NULL, true, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'pro', 'Pro', 'Restaurants 10–50 tables',
    'Tout ce qu''il faut pour opérer à plein régime.', 29, 23, 'EUR',
    -1, 10, 5, -1,
    '{"kds":true,"advancedReports":true,"apiAccess":false,"multiSite":false,"customBranding":true}'::jsonb,
    ARRAY['Commandes illimitées','Menu illimité','10 tables + QR codes','5 comptes staff','Kitchen Display System','Rapports avancés','Support prioritaire'],
    'Le plus populaire', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'enterprise', 'Enterprise', 'Chaînes & multi-sites',
    'Pour les restaurants à fort volume et multi-établissements.', 99, 79, 'EUR',
    -1, -1, -1, -1,
    '{"kds":true,"advancedReports":true,"apiAccess":true,"multiSite":true,"customBranding":true}'::jsonb,
    ARRAY['Commandes illimitées','Menu illimité','Tables illimitées','Staff illimité','Multi-établissements','API & intégrations','Manager dédié + SLA 99,9 %'],
    NULL, false, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
