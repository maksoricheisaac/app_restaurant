-- TVA : ventilation HT / taxe / TTC sur chaque ligne et chaque ticket.
--
-- `Restaurant.taxRate` et `Restaurant.taxIncluded` étaient saisis à
-- l'installation depuis l'origine sans qu'aucun calcul ne les lise. Un ticket
-- sans ventilation de taxe n'est opposable à personne — ni au client, ni au
-- comptable, ni à l'administration.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Taux par article
-- ─────────────────────────────────────────────────────────────────────────────

-- Null = taux par défaut de l'établissement. Laisser la colonne vide plutôt
-- que d'y recopier le taux courant : le jour où l'établissement change de
-- taux, les articles qui n'en ont pas de propre doivent suivre.
ALTER TABLE "MenuItem" ADD COLUMN "taxRate" DECIMAL(65,30);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Ventilation par ligne
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "OrderItemsOnOrders"
  ADD COLUMN "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "OrderItemsOnOrders"
  ADD COLUMN "lineExclTax" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "OrderItemsOnOrders"
  ADD COLUMN "lineTax" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "OrderItemsOnOrders"
  ADD COLUMN "lineInclTax" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Ventilation par ticket
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "Order"
  ADD COLUMN "taxIncluded" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Order" ADD COLUMN "deliveryTaxRate" DECIMAL(65,30);
ALTER TABLE "Order" ADD COLUMN "subtotalExclTax" DECIMAL(65,30);
ALTER TABLE "Order" ADD COLUMN "taxTotal" DECIMAL(65,30);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Reprise de l'historique
--
-- Les tickets déjà enregistrés ont été facturés sous le régime paramétré à
-- l'époque, même si le logiciel ne le ventilait pas. On reconstruit donc la
-- ventilation avec le taux et le sens de calcul actuellement configurés,
-- plutôt que d'inscrire une taxe nulle qui serait fausse dès que
-- l'établissement en applique une.
--
-- Limite assumée : le taux par article n'existait pas, tout l'historique
-- reçoit donc le taux par défaut de l'établissement. C'est la meilleure
-- reconstruction possible à partir de ce qui a été conservé.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE "Order" o
SET "taxIncluded" = r."taxIncluded",
    "deliveryTaxRate" = r."taxRate"
FROM "Restaurant" r
WHERE r."id" = 'restaurant';

-- Ventilation des lignes. `ROUND(x, 2)` sur un NUMERIC est exact en
-- PostgreSQL — pas de dérive binaire comme en virgule flottante.
UPDATE "OrderItemsOnOrders" l
SET "taxRate" = r."taxRate",
    "lineInclTax" = CASE
      WHEN r."taxIncluded"
        THEN ROUND(l."price" * l."quantity", 2)
      ELSE ROUND(l."price" * l."quantity" * (1 + r."taxRate" / 100), 2)
    END,
    "lineExclTax" = CASE
      WHEN r."taxIncluded"
        THEN ROUND(l."price" * l."quantity" / (1 + r."taxRate" / 100), 2)
      ELSE ROUND(l."price" * l."quantity", 2)
    END
FROM "Restaurant" r
WHERE r."id" = 'restaurant';

-- La taxe se déduit par différence : c'est ce qui garantit que HT + TVA
-- redonne exactement le TTC, sans second arrondi qui décalerait d'un centime.
UPDATE "OrderItemsOnOrders"
SET "lineTax" = "lineInclTax" - "lineExclTax";

-- Totaux du ticket : somme des lignes ACTIVES (une ligne annulée n'est pas
-- facturée) augmentée de la ventilation des frais de livraison.
WITH line_totals AS (
  SELECT
    l."orderId",
    SUM(l."lineExclTax") AS excl,
    SUM(l."lineTax")     AS tax
  FROM "OrderItemsOnOrders" l
  WHERE l."status" <> 'cancelled'
  GROUP BY l."orderId"
),
delivery AS (
  SELECT
    o."id" AS order_id,
    CASE
      WHEN COALESCE(o."deliveryFee", 0) = 0 THEN 0
      WHEN o."taxIncluded"
        THEN ROUND(o."deliveryFee" / (1 + COALESCE(o."deliveryTaxRate", 0) / 100), 2)
      ELSE ROUND(o."deliveryFee", 2)
    END AS excl,
    CASE
      WHEN COALESCE(o."deliveryFee", 0) = 0 THEN 0
      WHEN o."taxIncluded"
        THEN ROUND(o."deliveryFee", 2)
             - ROUND(o."deliveryFee" / (1 + COALESCE(o."deliveryTaxRate", 0) / 100), 2)
      ELSE ROUND(o."deliveryFee" * COALESCE(o."deliveryTaxRate", 0) / 100, 2)
    END AS tax
  FROM "Order" o
)
UPDATE "Order" o
SET "subtotalExclTax" = COALESCE(lt.excl, 0) + d.excl,
    "taxTotal"        = COALESCE(lt.tax, 0) + d.tax
FROM delivery d
LEFT JOIN line_totals lt ON lt."orderId" = d.order_id
WHERE o."id" = d.order_id;

-- `Order.total` reste le montant TTC. Il est réaligné sur la ventilation :
-- sous un régime de prix HT, le total dû n'est plus la somme des prix saisis.
UPDATE "Order"
SET "total" = COALESCE("subtotalExclTax", 0) + COALESCE("taxTotal", 0)
WHERE NOT "taxIncluded";
