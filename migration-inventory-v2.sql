-- Migration pour ajouter les champs packSize et category au modèle Ingredient
-- À exécuter si vous ne voulez pas utiliser Prisma migrate

-- Ajouter le champ packSize (nombre d'unités dans un pack)
ALTER TABLE "Ingredient" ADD COLUMN IF NOT EXISTS "packSize" INTEGER;

-- Ajouter le champ category (catégorie du produit)
ALTER TABLE "Ingredient" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- Exemples de mise à jour pour les produits existants
-- Décommenter et adapter selon vos besoins

-- Définir la catégorie "Boisson" pour les produits de boisson
-- UPDATE "Ingredient" SET "category" = 'Boisson' WHERE "name" ILIKE '%primus%' OR "name" ILIKE '%skol%' OR "name" ILIKE '%coca%';

-- Définir le packSize pour les bières (généralement 12 ou 24)
-- UPDATE "Ingredient" SET "packSize" = 12 WHERE "category" = 'Boisson' AND "unit" = 'unité';

-- Définir la catégorie "Ingrédient" pour les autres produits
-- UPDATE "Ingredient" SET "category" = 'Ingrédient' WHERE "category" IS NULL;

-- Vérifier les modifications
SELECT id, name, unit, stock, "minStock", category, "packSize" FROM "Ingredient" LIMIT 10;
