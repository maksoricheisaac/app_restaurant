-- Script SQL pour configurer la gestion de stock des boissons
-- À exécuter dans votre base de données PostgreSQL

-- ============================================
-- 1. CRÉER LA CATÉGORIE BOISSONS
-- ============================================

INSERT INTO "MenuCategory" (id, name) VALUES 
  ('cat-boissons', 'Boissons')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. CRÉER LES INGRÉDIENTS (BOISSONS)
-- ============================================

-- Boissons gazeuses
INSERT INTO "Ingredient" (id, name, unit, stock, "minStock", "createdAt", "updatedAt") VALUES 
  ('ing-coca-33cl', 'Coca-Cola 33cl', 'unité', 100, 20, NOW(), NOW()),
  ('ing-coca-50cl', 'Coca-Cola 50cl', 'unité', 80, 15, NOW(), NOW()),
  ('ing-sprite-33cl', 'Sprite 33cl', 'unité', 90, 20, NOW(), NOW()),
  ('ing-fanta-33cl', 'Fanta 33cl', 'unité', 85, 20, NOW(), NOW()),
  ('ing-fanta-orange', 'Fanta Orange 33cl', 'unité', 75, 15, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Eaux
INSERT INTO "Ingredient" (id, name, unit, stock, "minStock", "createdAt", "updatedAt") VALUES 
  ('ing-eau-50cl', 'Eau minérale 50cl', 'unité', 150, 30, NOW(), NOW()),
  ('ing-eau-1l', 'Eau minérale 1L', 'unité', 100, 20, NOW(), NOW()),
  ('ing-eau-gazeuse', 'Eau gazeuse 50cl', 'unité', 80, 15, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Jus
INSERT INTO "Ingredient" (id, name, unit, stock, "minStock", "createdAt", "updatedAt") VALUES 
  ('ing-jus-orange', 'Jus d''Orange 25cl', 'unité', 60, 15, NOW(), NOW()),
  ('ing-jus-pomme', 'Jus de Pomme 25cl', 'unité', 55, 15, NOW(), NOW()),
  ('ing-jus-ananas', 'Jus d''Ananas 25cl', 'unité', 50, 10, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Boissons chaudes
INSERT INTO "Ingredient" (id, name, unit, stock, "minStock", "createdAt", "updatedAt") VALUES 
  ('ing-cafe', 'Café (dose)', 'unité', 200, 50, NOW(), NOW()),
  ('ing-the', 'Thé (sachet)', 'unité', 150, 40, NOW(), NOW()),
  ('ing-chocolat', 'Chocolat chaud (dose)', 'unité', 100, 25, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. CRÉER LES ITEMS DE MENU (BOISSONS)
-- ============================================

-- Boissons gazeuses
INSERT INTO "MenuItem" (id, name, description, price, image, available, "categoryId") VALUES 
  ('menu-coca-33cl', 'Coca-Cola 33cl', 'Boisson gazeuse rafraîchissante', 1.50, NULL, true, 'cat-boissons'),
  ('menu-coca-50cl', 'Coca-Cola 50cl', 'Grande bouteille de Coca-Cola', 2.00, NULL, true, 'cat-boissons'),
  ('menu-sprite-33cl', 'Sprite 33cl', 'Boisson gazeuse au citron', 1.50, NULL, true, 'cat-boissons'),
  ('menu-fanta-33cl', 'Fanta 33cl', 'Boisson gazeuse à l''orange', 1.50, NULL, true, 'cat-boissons')
ON CONFLICT (id) DO NOTHING;

-- Eaux
INSERT INTO "MenuItem" (id, name, description, price, image, available, "categoryId") VALUES 
  ('menu-eau-50cl', 'Eau minérale 50cl', 'Eau plate naturelle', 1.00, NULL, true, 'cat-boissons'),
  ('menu-eau-1l', 'Eau minérale 1L', 'Grande bouteille d''eau plate', 1.50, NULL, true, 'cat-boissons'),
  ('menu-eau-gazeuse', 'Eau gazeuse 50cl', 'Eau pétillante', 1.20, NULL, true, 'cat-boissons')
ON CONFLICT (id) DO NOTHING;

-- Jus
INSERT INTO "MenuItem" (id, name, description, price, image, available, "categoryId") VALUES 
  ('menu-jus-orange', 'Jus d''Orange', 'Jus 100% pur fruit', 2.50, NULL, true, 'cat-boissons'),
  ('menu-jus-pomme', 'Jus de Pomme', 'Jus 100% pur fruit', 2.50, NULL, true, 'cat-boissons'),
  ('menu-jus-ananas', 'Jus d''Ananas', 'Jus 100% pur fruit', 2.50, NULL, true, 'cat-boissons')
ON CONFLICT (id) DO NOTHING;

-- Boissons chaudes
INSERT INTO "MenuItem" (id, name, description, price, image, available, "categoryId") VALUES 
  ('menu-cafe', 'Café', 'Café expresso', 1.50, NULL, true, 'cat-boissons'),
  ('menu-the', 'Thé', 'Thé chaud (plusieurs parfums)', 1.50, NULL, true, 'cat-boissons'),
  ('menu-chocolat', 'Chocolat chaud', 'Chocolat chaud onctueux', 2.00, NULL, true, 'cat-boissons')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. CRÉER LES RECETTES (LIEN MENU → INGRÉDIENT)
-- ============================================

-- Boissons gazeuses (1 unité = 1 bouteille)
INSERT INTO "Recipe" (id, "menuItemId", "ingredientId", quantity) VALUES 
  ('rec-coca-33cl', 'menu-coca-33cl', 'ing-coca-33cl', 1),
  ('rec-coca-50cl', 'menu-coca-50cl', 'ing-coca-50cl', 1),
  ('rec-sprite-33cl', 'menu-sprite-33cl', 'ing-sprite-33cl', 1),
  ('rec-fanta-33cl', 'menu-fanta-33cl', 'ing-fanta-33cl', 1)
ON CONFLICT (id) DO NOTHING;

-- Eaux
INSERT INTO "Recipe" (id, "menuItemId", "ingredientId", quantity) VALUES 
  ('rec-eau-50cl', 'menu-eau-50cl', 'ing-eau-50cl', 1),
  ('rec-eau-1l', 'menu-eau-1l', 'ing-eau-1l', 1),
  ('rec-eau-gazeuse', 'menu-eau-gazeuse', 'ing-eau-gazeuse', 1)
ON CONFLICT (id) DO NOTHING;

-- Jus
INSERT INTO "Recipe" (id, "menuItemId", "ingredientId", quantity) VALUES 
  ('rec-jus-orange', 'menu-jus-orange', 'ing-jus-orange', 1),
  ('rec-jus-pomme', 'menu-jus-pomme', 'ing-jus-pomme', 1),
  ('rec-jus-ananas', 'menu-jus-ananas', 'ing-jus-ananas', 1)
ON CONFLICT (id) DO NOTHING;

-- Boissons chaudes
INSERT INTO "Recipe" (id, "menuItemId", "ingredientId", quantity) VALUES 
  ('rec-cafe', 'menu-cafe', 'ing-cafe', 1),
  ('rec-the', 'menu-the', 'ing-the', 1),
  ('rec-chocolat', 'menu-chocolat', 'ing-chocolat', 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. VÉRIFICATION
-- ============================================

-- Vérifier les catégories
SELECT * FROM "MenuCategory" WHERE name LIKE '%oisson%';

-- Vérifier les ingrédients
SELECT id, name, stock, "minStock" FROM "Ingredient" ORDER BY name;

-- Vérifier les items de menu
SELECT m.id, m.name, m.price, c.name as category 
FROM "MenuItem" m 
JOIN "MenuCategory" c ON m."categoryId" = c.id
WHERE c.name LIKE '%oisson%'
ORDER BY m.name;

-- Vérifier les recettes
SELECT 
  m.name as menu_item,
  i.name as ingredient,
  r.quantity
FROM "Recipe" r
JOIN "MenuItem" m ON r."menuItemId" = m.id
JOIN "Ingredient" i ON r."ingredientId" = i.id
JOIN "MenuCategory" c ON m."categoryId" = c.id
WHERE c.name LIKE '%oisson%'
ORDER BY m.name;

-- ============================================
-- 6. REQUÊTES UTILES
-- ============================================

-- Voir le stock actuel de toutes les boissons
SELECT 
  i.name as ingredient,
  i.stock as "stock_actuel",
  i."minStock" as "stock_minimum",
  CASE 
    WHEN i.stock <= i."minStock" THEN '⚠️ ALERTE'
    WHEN i.stock <= i."minStock" * 1.5 THEN '⚡ BAS'
    ELSE '✅ OK'
  END as statut
FROM "Ingredient" i
ORDER BY i.stock ASC;

-- Voir les mouvements de stock récents
SELECT 
  sm.type,
  i.name as ingredient,
  sm.quantity,
  sm.description,
  sm."createdAt"
FROM "StockMovement" sm
JOIN "Ingredient" i ON sm."ingredientId" = i.id
ORDER BY sm."createdAt" DESC
LIMIT 20;

-- Voir les boissons les plus commandées
SELECT 
  mi.name as boisson,
  COUNT(oi.id) as "nombre_commandes",
  SUM(oi.quantity) as "quantite_totale"
FROM "OrderItem" oi
JOIN "MenuItem" mi ON oi."menuItemId" = mi.id
JOIN "MenuCategory" mc ON mi."categoryId" = mc.id
WHERE mc.name LIKE '%oisson%'
GROUP BY mi.name
ORDER BY "quantite_totale" DESC;

-- ============================================
-- 7. MAINTENANCE
-- ============================================

-- Réapprovisionner un ingrédient
-- UPDATE "Ingredient" SET stock = stock + 50 WHERE id = 'ing-coca-33cl';

-- Ajuster le stock minimum
-- UPDATE "Ingredient" SET "minStock" = 30 WHERE id = 'ing-coca-33cl';

-- Désactiver une boisson temporairement
-- UPDATE "MenuItem" SET available = false WHERE id = 'menu-coca-33cl';

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- 📝 Notes:
-- 1. Ce script utilise ON CONFLICT DO NOTHING pour éviter les doublons
-- 2. Adaptez les prix selon votre région
-- 3. Ajustez les stocks initiaux selon vos besoins
-- 4. Les IDs sont préfixés pour faciliter l'identification
-- 5. Exécutez les requêtes de vérification pour confirmer

-- 🚀 Pour exécuter:
-- psql -U votre_user -d votre_database -f setup-boissons-stock.sql

-- Ou via Prisma Studio:
-- pnpm prisma studio
