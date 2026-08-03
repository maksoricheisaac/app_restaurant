-- =============================================================================
-- Migration : SaaS multi-tenant  ->  logiciel mono-établissement
-- =============================================================================
--
-- Cette migration est DESTRUCTIVE et IRRÉVERSIBLE. Elle transforme une base
-- multi-tenant en base d'un établissement unique :
--
--   1. Élection de l'établissement survivant  (le plus ancien Tenant actif)
--   2. Suppression de toutes les données des autres tenants
--   3. Fusion Tenant + RestaurantSettings  ->  table singleton "Restaurant"
--   4. TenantMembership.role  ->  User.role  (la table de liaison disparaît)
--   5. Suppression de la colonne "tenantId" des 21 tables qui la portaient
--   6. Suppression des tables et enums SaaS
--   7. Reconstruction des index/contraintes sans dimension tenant
--
-- L'établissement survivant peut être forcé avant exécution en définissant la
-- variable de session :  SET LOCAL flashmenu.tenant_id = '<uuid>';
--
-- ⚠️  SAUVEGARDER LA BASE AVANT EXÉCUTION (pg_dump -Fc). Voir le plan de
--     migration dans docs/MIGRATION_SINGLE_RESTAURANT.md.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Élection de l'établissement survivant
-- -----------------------------------------------------------------------------

CREATE TEMPORARY TABLE "_survivor" ON COMMIT DROP AS
SELECT COALESCE(
    NULLIF(current_setting('flashmenu.tenant_id', true), ''),
    (SELECT "id" FROM "Tenant" WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1)
  ) AS "id";

DO $$
BEGIN
  IF (SELECT "id" FROM "_survivor") IS NULL THEN
    RAISE NOTICE '[single_restaurant] Aucun tenant actif — la base sera initialisée vide, l''assistant de première installation créera le restaurant.';
  ELSE
    RAISE NOTICE '[single_restaurant] Établissement retenu : %', (SELECT "id" FROM "_survivor");
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Purge des autres tenants
--    Les FK ON DELETE CASCADE de "Tenant" emportent commandes, menus, tables,
--    paiements, stock, etc. de chaque tenant supprimé.
-- -----------------------------------------------------------------------------

DELETE FROM "Tenant"
WHERE "id" IS DISTINCT FROM (SELECT "id" FROM "_survivor");

-- Comptes sans rattachement à l'établissement survivant (comptes d'autres
-- restaurants, super-admins et supports de la plateforme). Supprimés quand
-- aucune écriture comptable ne les référence ; désactivés sinon, car les FK
-- Payment/Transaction/CashRegisterSession sont volontairement en RESTRICT
-- pour protéger l'historique financier.
DELETE FROM "User" u
WHERE NOT EXISTS (
        SELECT 1 FROM "TenantMembership" m
        WHERE m."userId" = u."id"
          AND m."tenantId" = (SELECT "id" FROM "_survivor")
      )
  AND NOT EXISTS (SELECT 1 FROM "Payment" p WHERE p."cashierId" = u."id")
  AND NOT EXISTS (SELECT 1 FROM "Transaction" t WHERE t."cashierId" = u."id")
  AND NOT EXISTS (SELECT 1 FROM "CashRegisterSession" c WHERE c."openedBy" = u."id" OR c."closedBy" = u."id");

UPDATE "User" u
SET "status" = 'inactive'
WHERE NOT EXISTS (
  SELECT 1 FROM "TenantMembership" m
  WHERE m."userId" = u."id"
    AND m."tenantId" = (SELECT "id" FROM "_survivor")
);

-- -----------------------------------------------------------------------------
-- 3. Table singleton "Restaurant"  (fusion Tenant + RestaurantSettings)
-- -----------------------------------------------------------------------------

CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL DEFAULT 'restaurant',

    "name" TEXT NOT NULL,
    "slogan" TEXT,
    "description" TEXT,
    "cuisineType" TEXT,

    "logo" TEXT,
    "logoPathname" TEXT,
    "bannerUrl" TEXT,
    "bannerPathname" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#f97316',

    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "website" TEXT,

    "country" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',

    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "twitterUrl" TEXT,
    "youtubeUrl" TEXT,

    "dineInEnabled" BOOLEAN NOT NULL DEFAULT true,
    "takeawayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxOrdersPerHour" INTEGER NOT NULL DEFAULT 10,
    "maxOrdersPerUserHour" INTEGER NOT NULL DEFAULT 3,
    "maxReservationGuests" INTEGER NOT NULL DEFAULT 20,
    "maxDaysInAdvance" INTEGER NOT NULL DEFAULT 30,

    "defaultPaymentMethod" "PaymentMethod" NOT NULL DEFAULT 'cash',
    "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxIncluded" BOOLEAN NOT NULL DEFAULT true,
    "requireCashSession" BOOLEAN NOT NULL DEFAULT true,
    "defaultOpeningFloat" DECIMAL(65,30) NOT NULL DEFAULT 0,

    "receiptPrinterName" TEXT,
    "kitchenPrinterName" TEXT,
    "receiptPaperWidth" INTEGER NOT NULL DEFAULT 80,
    "receiptHeader" TEXT,
    "receiptFooter" TEXT,
    "autoPrintReceipt" BOOLEAN NOT NULL DEFAULT false,
    "autoPrintKitchenTicket" BOOLEAN NOT NULL DEFAULT true,

    "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "setupCompletedAt" TIMESTAMP(3),

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- Singleton garanti par la base, pas seulement par le code : la clé primaire
-- ne peut valoir qu'une seule chose, donc la table ne peut contenir qu'une
-- seule ligne. Créer un second établissement est impossible.
ALTER TABLE "Restaurant"
  ADD CONSTRAINT "Restaurant_singleton_check" CHECK ("id" = 'restaurant');

INSERT INTO "Restaurant" (
    "id", "name", "description", "cuisineType",
    "logo", "logoPathname", "bannerUrl", "bannerPathname", "primaryColor",
    "phone", "email", "address", "website",
    "country", "currency", "timezone",
    "facebookUrl", "instagramUrl", "twitterUrl", "youtubeUrl",
    "dineInEnabled", "takeawayEnabled", "deliveryEnabled",
    "maxOrdersPerHour", "maxOrdersPerUserHour", "maxReservationGuests", "maxDaysInAdvance",
    "setupCompleted", "setupCompletedAt",
    "createdAt", "updatedAt"
)
SELECT
    'restaurant',
    COALESCE(s."name", t."name"),
    s."description",
    t."cuisineType",
    COALESCE(s."logo", t."logo"), t."logoPathname", t."bannerUrl", t."bannerPathname", t."primaryColor",
    s."phone", s."email", s."address", s."website",
    t."country", t."currency", t."timezone",
    s."facebookUrl", s."instagramUrl", s."twitterUrl", s."youtubeUrl",
    COALESCE(s."dineInEnabled", true), COALESCE(s."takeawayEnabled", true), COALESCE(s."deliveryEnabled", true),
    COALESCE(s."maxOrdersPerHour", 10), COALESCE(s."maxOrdersPerUserHour", 3),
    COALESCE(s."maxReservationGuests", 20), COALESCE(s."maxDaysInAdvance", 30),
    true, t."createdAt",
    t."createdAt", CURRENT_TIMESTAMP
FROM "Tenant" t
LEFT JOIN "RestaurantSettings" s ON s."tenantId" = t."id"
WHERE t."id" = (SELECT "id" FROM "_survivor");

-- -----------------------------------------------------------------------------
-- 4. Le rôle remonte sur User — TenantMembership disparaît
--
--    Le nouveau modèle n'en conserve que cinq (owner, manager, waiter, chef,
--    cashier). `TenantMembership.role` était un TEXT libre : la base contient
--    en pratique des valeurs hors de ce jeu (« admin » posé par d'anciens
--    seeds, « head_chef » de l'ancien modèle). Le CASE doit donc être
--    EXHAUSTIF — sans branche ELSE, une valeur imprévue ferait échouer la
--    contrainte CHECK posée juste après, et avec elle toute la migration.
-- -----------------------------------------------------------------------------

ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'waiter';

UPDATE "User" u
SET "role" = CASE m."role"
               WHEN 'owner'     THEN 'owner'
               WHEN 'manager'   THEN 'manager'
               WHEN 'waiter'    THEN 'waiter'
               WHEN 'cashier'   THEN 'cashier'
               WHEN 'chef'      THEN 'chef'
               -- Chef de cuisine fusionné dans chef
               WHEN 'head_chef' THEN 'chef'
               -- « admin » venait des anciens seeds. Rétrogradé manager et non
               -- owner : le propriétaire doit rester unique, et il est déjà
               -- désigné par le membership 'owner'.
               WHEN 'admin'     THEN 'manager'
               -- Filet de sécurité : le rôle le moins privilégié plutôt qu'un
               -- échec de migration sur une valeur inattendue.
               ELSE 'waiter'
             END
FROM "TenantMembership" m
WHERE m."userId" = u."id"
  AND m."tenantId" = (SELECT "id" FROM "_survivor");

-- Le logiciel a besoin d'exactement un propriétaire. Si l'établissement
-- retenu n'en avait pas (donnée incohérente, ou owner supprimé), on promeut
-- le plus ancien compte actif — sans quoi personne ne pourrait administrer
-- le restaurant après migration.
UPDATE "User"
SET "role" = 'owner'
WHERE "id" = (
  SELECT u."id" FROM "User" u
  WHERE u."status" = 'active'
  ORDER BY u."createdAt" ASC
  LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM "User" WHERE "role" = 'owner');

-- Inversement, si plusieurs comptes portent 'owner', on ne garde que le plus
-- ancien : l'invariant « exactement un propriétaire » doit tenir dès la
-- première requête post-migration.
UPDATE "User"
SET "role" = 'manager'
WHERE "role" = 'owner'
  AND "id" <> (
    SELECT u."id" FROM "User" u
    WHERE u."role" = 'owner'
    ORDER BY u."createdAt" ASC
    LIMIT 1
  );

ALTER TABLE "User"
  ADD CONSTRAINT "User_role_check"
  CHECK ("role" IN ('owner', 'manager', 'waiter', 'chef', 'cashier'));

ALTER TABLE "User" DROP COLUMN "tenantId";
ALTER TABLE "User" DROP COLUMN "platformRole";
ALTER TABLE "User" DROP COLUMN "onboardingCompleted";

DROP INDEX IF EXISTS "User_tenantId_idx";
CREATE INDEX "User_role_idx" ON "User"("role");

-- -----------------------------------------------------------------------------
-- 5. MembershipInvite -> StaffInvite
-- -----------------------------------------------------------------------------

DELETE FROM "MembershipInvite"
WHERE "tenantId" IS DISTINCT FROM (SELECT "id" FROM "_survivor");

ALTER TABLE "MembershipInvite" RENAME TO "StaffInvite";

-- ⚠️ DROP COLUMN emporte silencieusement tout index qui référence la colonne,
--    y compris l'index unique PARTIEL
--    `MembershipInvite_one_pending_per_email_key` sur (tenantId, email)
--    WHERE status='pending'. Cet index est la garantie « une seule invitation
--    en attente par adresse » ; il est recréé plus bas sur (email) seul —
--    version plus forte, puisqu'il n'y a plus qu'un établissement.
ALTER TABLE "StaffInvite" DROP COLUMN "tenantId";

UPDATE "StaffInvite"
SET "role" = CASE "role"
               WHEN 'head_chef' THEN 'chef'
               WHEN 'admin'     THEN 'manager'
               WHEN 'owner'     THEN 'manager'
               WHEN 'manager'   THEN 'manager'
               WHEN 'waiter'    THEN 'waiter'
               WHEN 'cashier'   THEN 'cashier'
               WHEN 'chef'      THEN 'chef'
               ELSE 'waiter'
             END;

ALTER TABLE "StaffInvite"
  ADD CONSTRAINT "StaffInvite_role_check"
  CHECK ("role" IN ('manager', 'waiter', 'chef', 'cashier'));

DROP INDEX IF EXISTS "MembershipInvite_tenantId_idx";
DROP INDEX IF EXISTS "MembershipInvite_tenantId_status_idx";
DROP INDEX IF EXISTS "MembershipInvite_email_idx";
DROP INDEX IF EXISTS "MembershipInvite_tokenHash_key";
DROP INDEX IF EXISTS "MembershipInvite_one_pending_per_email_key";

ALTER TABLE "StaffInvite" RENAME CONSTRAINT "MembershipInvite_pkey" TO "StaffInvite_pkey";

CREATE UNIQUE INDEX "StaffInvite_tokenHash_key" ON "StaffInvite"("tokenHash");
CREATE INDEX "StaffInvite_status_idx" ON "StaffInvite"("status");
CREATE INDEX "StaffInvite_email_idx" ON "StaffInvite"("email");

-- Au plus une invitation en attente par adresse email. C'est la base qui le
-- garantit, pas seulement le pré-contrôle de StaffService.invite() — deux
-- invitations simultanées pour la même adresse seraient sinon acceptées.
CREATE UNIQUE INDEX "StaffInvite_one_pending_per_email_key"
  ON "StaffInvite"("email")
  WHERE "status" = 'pending'::"InviteStatus";

-- -----------------------------------------------------------------------------
-- 6. Permissions : suppression de la dimension tenant
-- -----------------------------------------------------------------------------

DELETE FROM "RolePermission"
WHERE "tenantId" IS DISTINCT FROM (SELECT "id" FROM "_survivor");

UPDATE "RolePermission" SET "role" = 'chef' WHERE "role" = 'head_chef';

-- Fusion d'un éventuel doublon owner/head_chef -> chef créé par l'UPDATE
DELETE FROM "RolePermission" a
USING "RolePermission" b
WHERE a."role" = b."role" AND a."id" > b."id";

ALTER TABLE "RolePermission" DROP COLUMN "tenantId";
CREATE UNIQUE INDEX "RolePermission_role_key" ON "RolePermission"("role");

DELETE FROM "UserPermission" up
WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = up."userId");

ALTER TABLE "UserPermission" DROP COLUMN "tenantId";

DELETE FROM "UserPermission" a
USING "UserPermission" b
WHERE a."userId" = b."userId" AND a."permission" = b."permission" AND a."id" > b."id";

DROP INDEX IF EXISTS "UserPermission_tenantId_idx";
CREATE UNIQUE INDEX "UserPermission_userId_permission_key" ON "UserPermission"("userId", "permission");

-- -----------------------------------------------------------------------------
-- 7. Suppression de "tenantId" sur toutes les tables métier
--    DROP COLUMN emporte les FK et les index qui portaient sur la colonne.
-- -----------------------------------------------------------------------------

ALTER TABLE "Customer" DROP COLUMN "tenantId";
ALTER TABLE "Table" DROP COLUMN "tenantId";
ALTER TABLE "Reservation" DROP COLUMN "tenantId";
ALTER TABLE "MenuCategory" DROP COLUMN "tenantId";
ALTER TABLE "MenuItem" DROP COLUMN "tenantId";
ALTER TABLE "Order" DROP COLUMN "tenantId";
ALTER TABLE "Payment" DROP COLUMN "tenantId";
ALTER TABLE "CashRegisterSession" DROP COLUMN "tenantId";
ALTER TABLE "Ingredient" DROP COLUMN "tenantId";
ALTER TABLE "Recipe" DROP COLUMN "tenantId";
ALTER TABLE "StockMovement" DROP COLUMN "tenantId";
ALTER TABLE "Transaction" DROP COLUMN "tenantId";
ALTER TABLE "DeliveryZone" DROP COLUMN "tenantId";
ALTER TABLE "OpeningHours" DROP COLUMN "tenantId";
ALTER TABLE "ExceptionalClosure" DROP COLUMN "tenantId";
ALTER TABLE "Message" DROP COLUMN "tenantId";
ALTER TABLE "Report" DROP COLUMN "tenantId";

-- -----------------------------------------------------------------------------
-- 8. Suppression des tables et enums SaaS
-- -----------------------------------------------------------------------------

DROP TABLE "TenantMembership";
DROP TABLE "RestaurantSettings";
DROP TABLE "FeatureFlag";
DROP TABLE "Domain";
DROP TABLE "Plan";
DROP TABLE "Tenant";

DROP TYPE "TenantStatus";
DROP TYPE "PlatformRole";

-- -----------------------------------------------------------------------------
-- 9. Reconstruction des index sans dimension tenant
--
--    IF NOT EXISTS systématique : DROP COLUMN n'emporte que les index qui
--    RÉFÉRENCENT la colonne supprimée. Ceux qui n'en dépendaient pas
--    (Customer_email_idx, par exemple) survivent et seraient recréés en
--    doublon — ce qui fait échouer toute la migration sur un 42P07.
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");
CREATE INDEX IF NOT EXISTS "Customer_deletedAt_idx" ON "Customer"("deletedAt");

CREATE INDEX IF NOT EXISTS "Table_number_idx" ON "Table"("number");
CREATE INDEX IF NOT EXISTS "Table_deletedAt_idx" ON "Table"("deletedAt");
-- Unicité du numéro de table, en libérant le numéro d'une table supprimée.
CREATE UNIQUE INDEX IF NOT EXISTS "Table_number_active_key" ON "Table"("number") WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Reservation_deletedAt_idx" ON "Reservation"("deletedAt");
CREATE INDEX IF NOT EXISTS "Reservation_date_idx" ON "Reservation"("date");
DROP INDEX IF EXISTS "Reservation_no_double_booking_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Reservation_no_double_booking_key"
  ON "Reservation"("tableId", "date", "time")
  WHERE "status" != 'cancelled'::"ReservationStatus"
    AND "deletedAt" IS NULL
    AND "tableId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "MenuCategory_deletedAt_idx" ON "MenuCategory"("deletedAt");
CREATE INDEX IF NOT EXISTS "MenuItem_categoryId_idx" ON "MenuItem"("categoryId");
CREATE INDEX IF NOT EXISTS "MenuItem_deletedAt_idx" ON "MenuItem"("deletedAt");

CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "Order_deletedAt_idx" ON "Order"("deletedAt");
CREATE INDEX IF NOT EXISTS "OrderItemsOnOrders_orderId_idx" ON "OrderItemsOnOrders"("orderId");

CREATE INDEX IF NOT EXISTS "Payment_createdAt_idx" ON "Payment"("createdAt");

DROP INDEX IF EXISTS "CashRegisterSession_one_open_per_tenant_key";
CREATE INDEX IF NOT EXISTS "CashRegisterSession_status_idx" ON "CashRegisterSession"("status");
CREATE INDEX IF NOT EXISTS "CashRegisterSession_openedAt_idx" ON "CashRegisterSession"("openedAt");
-- Au plus une session de caisse ouverte dans tout l'établissement.
CREATE UNIQUE INDEX IF NOT EXISTS "CashRegisterSession_one_open_key"
  ON "CashRegisterSession"((true))
  WHERE "status" = 'open';

CREATE INDEX IF NOT EXISTS "Ingredient_deletedAt_idx" ON "Ingredient"("deletedAt");
CREATE INDEX IF NOT EXISTS "Recipe_ingredientId_idx" ON "Recipe"("ingredientId");
CREATE INDEX IF NOT EXISTS "StockMovement_ingredientId_idx" ON "StockMovement"("ingredientId");
CREATE INDEX IF NOT EXISTS "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt");
CREATE INDEX IF NOT EXISTS "Transaction_orderId_idx" ON "Transaction"("orderId");

CREATE INDEX IF NOT EXISTS "DeliveryZone_deletedAt_idx" ON "DeliveryZone"("deletedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "OpeningHours_dayOfWeek_key" ON "OpeningHours"("dayOfWeek");
CREATE INDEX IF NOT EXISTS "ExceptionalClosure_date_idx" ON "ExceptionalClosure"("date");

CREATE INDEX IF NOT EXISTS "Message_status_idx" ON "Message"("status");
CREATE INDEX IF NOT EXISTS "Message_deletedAt_idx" ON "Message"("deletedAt");
CREATE INDEX IF NOT EXISTS "Report_createdAt_idx" ON "Report"("createdAt");
