# Migration Manuelle - Inventaire V2

## ⚠️ Important

La migration Prisma nécessite votre confirmation car elle modifie la structure de la base de données.

## Option 1 : Migration Prisma (Recommandée)

### Étape 1 : Exécuter la commande
Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
npx prisma migrate dev --name add_inventory_v2_fields
```

### Étape 2 : Confirmer
Quand Prisma demande :
```
⚠️  We need to reset the development database.
All data will be lost.
Do you want to continue? (y/N)
```

**Si vous êtes en développement et que vous pouvez perdre les données** : Tapez `y` puis Entrée

**Si vous avez des données importantes** : Tapez `N` puis utilisez l'Option 2 ci-dessous

### Étape 3 : Générer les types
```bash
npx prisma generate
```

### Étape 4 : Redémarrer
```bash
npm run dev
```

---

## Option 2 : Migration SQL Manuelle (Sans perte de données)

### Étape 1 : Se connecter à PostgreSQL

```bash
# Remplacez par vos identifiants
psql -U votre_utilisateur -d votre_base_de_donnees
```

### Étape 2 : Exécuter les commandes SQL

```sql
-- Ajouter le champ packSize
ALTER TABLE "Ingredient" ADD COLUMN IF NOT EXISTS "packSize" INTEGER;

-- Ajouter le champ category
ALTER TABLE "Ingredient" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- Vérifier que les colonnes ont été ajoutées
\d "Ingredient"
```

### Étape 3 : Mettre à jour les données existantes (Optionnel)

```sql
-- Définir la catégorie "Boisson" pour les produits de boisson
-- Adaptez selon vos données
UPDATE "Ingredient" 
SET "category" = 'Boisson' 
WHERE "name" ILIKE '%primus%' 
   OR "name" ILIKE '%skol%' 
   OR "name" ILIKE '%coca%'
   OR "name" ILIKE '%fanta%'
   OR "name" ILIKE '%sprite%';

-- Définir le packSize pour les bières (généralement 12 ou 24)
UPDATE "Ingredient" 
SET "packSize" = 12 
WHERE "category" = 'Boisson' 
  AND "unit" = 'unité'
  AND "name" ILIKE '%72cl%';

UPDATE "Ingredient" 
SET "packSize" = 24 
WHERE "category" = 'Boisson' 
  AND "unit" = 'unité'
  AND "name" ILIKE '%33cl%';

-- Définir la catégorie "Ingrédient" pour les autres produits
UPDATE "Ingredient" 
SET "category" = 'Ingrédient' 
WHERE "category" IS NULL;

-- Vérifier les modifications
SELECT id, name, unit, stock, "minStock", category, "packSize" 
FROM "Ingredient" 
LIMIT 20;
```

### Étape 4 : Marquer la migration comme appliquée

```bash
# Créer le fichier de migration
npx prisma migrate dev --create-only --name add_inventory_v2_fields

# Marquer comme appliquée (sans exécuter)
npx prisma migrate resolve --applied add_inventory_v2_fields
```

### Étape 5 : Générer les types
```bash
npx prisma generate
```

### Étape 6 : Redémarrer
```bash
npm run dev
```

---

## Option 3 : Migration avec Sauvegarde

### Étape 1 : Sauvegarder la base de données

```bash
# PostgreSQL
pg_dump -U votre_utilisateur votre_base > backup_avant_migration.sql

# Ou via Prisma Studio
npx prisma studio
# Exporter manuellement les données importantes
```

### Étape 2 : Appliquer la migration Prisma

```bash
npx prisma migrate dev --name add_inventory_v2_fields
# Tapez 'y' pour confirmer
```

### Étape 3 : Restaurer les données si nécessaire

```bash
# Si quelque chose ne va pas
psql -U votre_utilisateur votre_base < backup_avant_migration.sql
```

---

## Vérification Post-Migration

### 1. Vérifier le schéma

```bash
npx prisma studio
```

Ouvrir le modèle `Ingredient` et vérifier que les champs `packSize` et `category` existent.

### 2. Tester l'application

```bash
npm run dev
```

Accéder à : `http://localhost:3000/admin/inventory-v2`

### 3. Créer un produit test

1. Cliquer sur "Nouveau Produit"
2. Remplir tous les champs y compris `category` et `packSize`
3. Vérifier que la création fonctionne

---

## Dépannage

### Erreur : "Column already exists"

**Cause** : Les colonnes ont déjà été ajoutées manuellement

**Solution** :
```bash
npx prisma migrate resolve --applied add_inventory_v2_fields
npx prisma generate
```

### Erreur : "Migration failed"

**Cause** : Conflit avec des migrations existantes

**Solution** :
```bash
# Voir l'état des migrations
npx prisma migrate status

# Réinitialiser (ATTENTION : perte de données)
npx prisma migrate reset

# Ou résoudre manuellement
npx prisma migrate resolve --help
```

### Erreur : Types TypeScript incorrects

**Solution** :
```bash
npx prisma generate
# Redémarrer VSCode
# Redémarrer le serveur
```

---

## 📞 Besoin d'Aide ?

1. Vérifier `prisma/schema.prisma` - Les champs doivent être présents
2. Vérifier la console pour les erreurs
3. Consulter : https://www.prisma.io/docs/concepts/components/prisma-migrate

---

## ✅ Checklist Finale

- [ ] Migration appliquée (Option 1, 2 ou 3)
- [ ] `npx prisma generate` exécuté
- [ ] Serveur redémarré
- [ ] Page `/admin/inventory-v2` accessible
- [ ] Création d'un produit test réussie
- [ ] Champs `packSize` et `category` visibles

**Une fois toutes les cases cochées, le module Inventaire V2 est prêt ! 🎉**
