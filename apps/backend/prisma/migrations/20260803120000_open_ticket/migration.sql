-- Ticket ouvert : cycle de vie par ligne, numérotation séquentielle,
-- verrouillage à l'encaissement.
--
-- Avant cette migration, une commande était figée à sa création : aucune
-- route ne permettait d'y ajouter un article ni d'en retirer un. Le service à
-- table était donc impossible — pas de deuxième tournée, pas de correction
-- d'une erreur de saisie.
--
-- Reprise des données : toute commande existante est considérée comme
-- entièrement partie en cuisine (c'était le seul comportement possible), et
-- reçoit rétroactivement un numéro de ticket par jour de service.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Cycle de vie des lignes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE "OrderLineStatus" AS ENUM (
  'draft', 'sent', 'preparing', 'ready', 'served', 'cancelled'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Statuts de ticket : ajout de « open » et « paid »
--
-- Le type est recréé plutôt qu'étendu par ALTER TYPE ... ADD VALUE : une
-- valeur ajoutée ainsi n'est pas utilisable dans la même transaction, et
-- Prisma exécute chaque migration en une transaction unique.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";

CREATE TYPE "OrderStatus" AS ENUM (
  'open', 'pending', 'preparing', 'ready', 'served', 'paid', 'cancelled'
);

ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order"
  ALTER COLUMN "status" TYPE "OrderStatus"
  USING "status"::text::"OrderStatus";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'open';

DROP TYPE "OrderStatus_old";

-- Une commande déjà réglée relevait de l'état « served », qui servait à la
-- fois de « servi » et de « payé ». Les deux sont désormais distingués.
UPDATE "Order" o
SET "status" = 'paid'
WHERE o."status" = 'served'
  AND EXISTS (
    SELECT 1 FROM "Payment" p
    WHERE p."orderId" = o."id" AND p."status" = 'completed'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Numérotation des tickets
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "Order" ADD COLUMN "number" INTEGER;
ALTER TABLE "Order" ADD COLUMN "serviceDate" DATE;
ALTER TABLE "Order" ADD COLUMN "closedAt" TIMESTAMP(3);

-- Le jour de service est la date civile dans le fuseau de l'établissement :
-- un ticket de 23 h 30 à Paris appartient à la journée du 3, pas du 4.
WITH tz AS (
  SELECT COALESCE(MIN("timezone"), 'Europe/Paris') AS name FROM "Restaurant"
),
numbered AS (
  SELECT
    o."id",
    (o."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE tz.name)::date AS service_date,
    ROW_NUMBER() OVER (
      PARTITION BY (o."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE tz.name)::date
      ORDER BY o."createdAt", o."id"
    ) AS seq
  FROM "Order" o, tz
)
UPDATE "Order" o
SET "number" = numbered.seq,
    "serviceDate" = numbered.service_date
FROM numbered
WHERE o."id" = numbered."id";

ALTER TABLE "Order" ALTER COLUMN "number" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "serviceDate" SET NOT NULL;

-- Un numéro n'est jamais réattribué, y compris après archivage : l'index
-- couvre donc aussi les commandes soft-deleted.
CREATE UNIQUE INDEX "Order_serviceDate_number_key" ON "Order"("serviceDate", "number");
CREATE INDEX "Order_tableId_status_idx" ON "Order"("tableId", "status");

-- Horodatage de clôture recopié depuis le paiement, pour les tickets déjà
-- réglés avant cette migration.
UPDATE "Order" o
SET "closedAt" = p."createdAt"
FROM "Payment" p
WHERE p."orderId" = o."id" AND o."status" = 'paid';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Compteur de numérotation
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "TicketCounter" (
  "serviceDate" DATE NOT NULL,
  "lastNumber"  INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "TicketCounter_pkey" PRIMARY KEY ("serviceDate")
);

-- Reprise du compteur là où l'historique s'arrête, sinon le premier ticket
-- créé après la migration entrerait en collision avec un numéro existant.
INSERT INTO "TicketCounter" ("serviceDate", "lastNumber")
SELECT "serviceDate", MAX("number") FROM "Order" GROUP BY "serviceDate";

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Colonnes de cycle de vie sur les lignes
--
-- Défaut temporaire « sent » : toute ligne existante est partie en cuisine,
-- c'était le seul comportement possible. Le défaut passe à « draft » ensuite,
-- pour les lignes créées à partir de maintenant.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "OrderItemsOnOrders"
  ADD COLUMN "status" "OrderLineStatus" NOT NULL DEFAULT 'sent';
ALTER TABLE "OrderItemsOnOrders"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "OrderItemsOnOrders" ADD COLUMN "sentAt" TIMESTAMP(3);
ALTER TABLE "OrderItemsOnOrders" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "OrderItemsOnOrders" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "OrderItemsOnOrders" ADD COLUMN "cancelledBy" TEXT;

-- L'avancement de la commande devient celui de chacune de ses lignes.
UPDATE "OrderItemsOnOrders" l
SET "status" = CASE o."status"
                 WHEN 'preparing' THEN 'preparing'::"OrderLineStatus"
                 WHEN 'ready'     THEN 'ready'::"OrderLineStatus"
                 WHEN 'served'    THEN 'served'::"OrderLineStatus"
                 WHEN 'paid'      THEN 'served'::"OrderLineStatus"
                 WHEN 'cancelled' THEN 'cancelled'::"OrderLineStatus"
                 ELSE 'sent'::"OrderLineStatus"
               END,
    "sentAt" = o."createdAt",
    -- Les lignes existantes ont toutes été saisies à l'ouverture : leur date
    -- de création est celle de la commande, pas celle de la migration.
    "createdAt" = o."createdAt",
    "cancelledAt" = CASE WHEN o."status" = 'cancelled' THEN o."updatedAt" END,
    "cancelReason" = CASE WHEN o."status" = 'cancelled'
                          THEN 'Commande annulée avant la reprise du cycle de vie par ligne'
                     END
FROM "Order" o
WHERE l."orderId" = o."id";

ALTER TABLE "OrderItemsOnOrders" ALTER COLUMN "status" SET DEFAULT 'draft';

ALTER TABLE "OrderItemsOnOrders"
  ADD CONSTRAINT "OrderItemsOnOrders_cancelledBy_fkey"
  FOREIGN KEY ("cancelledBy") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "OrderItemsOnOrders_status_idx" ON "OrderItemsOnOrders"("status");
