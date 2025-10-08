# ⚡ Commandes Rapides - Gestion Stock Boissons

## 🚀 Démarrage Rapide

### 1. Nettoyer et Rebuild
```bash
# Supprimer le cache
rm -rf .next node_modules/.cache

# Régénérer Prisma
pnpm prisma generate

# Rebuild
pnpm build

# Démarrer
pnpm dev
```

### 2. Configurer les Boissons
```bash
# Option 1: Via psql
psql -U postgres -d restaurant_db -f setup-boissons-stock.sql

# Option 2: Via Prisma Studio
pnpm prisma studio
# Puis copier/coller les données du fichier SQL
```

### 3. Vérifier
```bash
# Ouvrir Prisma Studio
pnpm prisma studio

# Vérifier:
# - MenuCategory: "Boissons" existe
# - Ingredient: 16 ingrédients créés
# - MenuItem: 13 boissons créées
# - Recipe: 13 recettes créées
```

---

## 🧪 Tests Rapides

### Test 1: Commande Simple
```bash
# 1. Créer une commande avec 2x Coca-Cola
# 2. Changer statut à "served"
# 3. Vérifier logs console:
#    ✅ "2 mouvement(s) de stock créé(s) pour les boissons"
# 4. Vérifier stock Coca-Cola a diminué de 2
```

### Test 2: Commande Mixte
```bash
# 1. Créer commande: 1x Pizza + 2x Sprite
# 2. Changer statut à "served"
# 3. Vérifier logs:
#    ℹ️  "Article Pizza ignoré (pas une boisson)"
#    ✅ "1 mouvement(s) de stock créé(s) pour les boissons"
# 4. Vérifier seul Sprite a été décrementé
```

### Test 3: Stock Insuffisant
```bash
# 1. Mettre stock Coca-Cola à 1
# 2. Créer commande avec 5x Coca-Cola
# 3. Changer statut à "served"
# 4. Vérifier erreur:
#    ❌ "Stock insuffisant pour Coca-Cola 33cl"
```

---

## 📊 Requêtes SQL Utiles

### Voir Stock Actuel
```sql
SELECT name, stock, "minStock" 
FROM "Ingredient" 
ORDER BY stock ASC;
```

### Voir Stock Bas
```sql
SELECT name, stock, "minStock"
FROM "Ingredient"
WHERE stock <= "minStock"
ORDER BY stock ASC;
```

### Voir Mouvements Récents
```sql
SELECT 
  sm.type,
  i.name,
  sm.quantity,
  sm."createdAt"
FROM "StockMovement" sm
JOIN "Ingredient" i ON sm."ingredientId" = i.id
ORDER BY sm."createdAt" DESC
LIMIT 10;
```

### Réapprovisionner
```sql
-- Ajouter 50 unités
UPDATE "Ingredient" 
SET stock = stock + 50 
WHERE name = 'Coca-Cola 33cl';
```

### Reset Stock
```sql
-- Remettre tous les stocks à 100
UPDATE "Ingredient" 
SET stock = 100;
```

---

## 🔧 Dépannage Rapide

### Erreur: "menuItem is null"
```bash
# Solution: Déjà corrigée dans le code
# Vérifier que vous avez la dernière version
git pull
pnpm install
```

### Stock ne se décrémente pas
```bash
# 1. Vérifier la catégorie contient "boisson"
SELECT * FROM "MenuCategory" WHERE name LIKE '%oisson%';

# 2. Vérifier les recettes existent
SELECT * FROM "Recipe" WHERE "menuItemId" = 'votre-menu-id';

# 3. Vérifier les logs console
# Chercher: "Article X ignoré" ou "Aucune recette trouvée"
```

### Build échoue
```bash
# Nettoyer complètement
rm -rf .next node_modules/.cache
pnpm install
pnpm prisma generate
pnpm build
```

---

## 📝 Logs à Surveiller

### Console Navigateur
```javascript
// Ouvrir DevTools (F12) > Console
// Chercher:
✅ "Stock décrementé automatiquement"
✅ "X mouvement(s) de stock créé(s)"
⚠️  "Aucune recette trouvée"
❌ "Stock insuffisant"
```

### Console Serveur
```bash
# Terminal où tourne `pnpm dev`
# Chercher:
✅ Article Coca-Cola traité (boisson)
ℹ️  Article Pizza ignoré (pas une boisson)
⚠️  MenuItem non trouvé
```

---

## 🎯 Commandes de Maintenance

### Backup Base de Données
```bash
# Backup
pg_dump -U postgres restaurant_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres restaurant_db < backup_20250108.sql
```

### Voir Statistiques
```sql
-- Nombre total d'ingrédients
SELECT COUNT(*) FROM "Ingredient";

-- Nombre de mouvements aujourd'hui
SELECT COUNT(*) FROM "StockMovement" 
WHERE DATE("createdAt") = CURRENT_DATE;

-- Valeur totale du stock
SELECT SUM(stock * 1.5) as valeur_totale 
FROM "Ingredient";
```

### Nettoyer Mouvements Anciens
```sql
-- Supprimer mouvements > 6 mois
DELETE FROM "StockMovement" 
WHERE "createdAt" < NOW() - INTERVAL '6 months';
```

---

## 🚨 Alertes Stock Bas

### Voir Alertes
```sql
SELECT 
  name,
  stock,
  "minStock",
  (stock - "minStock") as difference
FROM "Ingredient"
WHERE stock <= "minStock"
ORDER BY difference ASC;
```

### Créer Alerte Email (TODO)
```typescript
// À implémenter dans inventory-actions.ts
async function checkLowStock() {
  const lowStock = await prisma.ingredient.findMany({
    where: { stock: { lte: prisma.ingredient.fields.minStock } }
  });
  
  if (lowStock.length > 0) {
    // Envoyer email
    await sendEmail({
      to: 'manager@restaurant.com',
      subject: `⚠️ ${lowStock.length} ingrédient(s) en stock bas`,
      body: lowStock.map(i => `${i.name}: ${i.stock}`).join('\n')
    });
  }
}
```

---

## 📱 Prisma Studio

### Ouvrir
```bash
pnpm prisma studio
```

### Navigation Rapide
- **Ingredient** : Voir/modifier stocks
- **StockMovement** : Historique des mouvements
- **MenuItem** : Voir les boissons
- **Recipe** : Voir les recettes
- **MenuCategory** : Vérifier "Boissons" existe

---

## 🔄 Workflow Quotidien

### Matin
```bash
# 1. Vérifier stock bas
SELECT name, stock FROM "Ingredient" WHERE stock <= "minStock";

# 2. Réapprovisionner si nécessaire
UPDATE "Ingredient" SET stock = stock + X WHERE id = 'ing-xxx';
```

### Soir
```bash
# 1. Voir mouvements du jour
SELECT * FROM "StockMovement" 
WHERE DATE("createdAt") = CURRENT_DATE;

# 2. Vérifier stock restant
SELECT name, stock FROM "Ingredient" ORDER BY stock ASC;
```

---

## 📚 Documentation Rapide

| Fichier | Description | Utilité |
|---------|-------------|---------|
| `GESTION_STOCK_BOISSONS.md` | Guide complet | Comprendre le système |
| `CORRECTIONS_STOCK.md` | Corrections techniques | Voir les changements |
| `setup-boissons-stock.sql` | Script SQL | Configuration initiale |
| `RESUME_FINAL_STOCK.md` | Vue d'ensemble | Résumé global |
| `COMMANDES_RAPIDES_STOCK.md` | Ce fichier | Référence rapide |

---

## ⚡ Raccourcis

```bash
# Alias utiles (ajouter à ~/.bashrc ou ~/.zshrc)
alias pdev="pnpm dev"
alias pbuild="pnpm build"
alias pstudio="pnpm prisma studio"
alias pgen="pnpm prisma generate"
alias pclean="rm -rf .next node_modules/.cache && pnpm prisma generate"

# Utilisation
pdev      # Démarrer dev
pstudio   # Ouvrir Prisma Studio
pclean    # Nettoyer et régénérer
```

---

## 🎉 Checklist Rapide

Avant de déployer :
- [ ] `pnpm build` réussit
- [ ] Tests manuels effectués
- [ ] Script SQL exécuté
- [ ] Données de test créées
- [ ] Logs vérifiés
- [ ] Documentation lue
- [ ] Équipe formée

---

**Dernière mise à jour** : 2025-10-08  
**Version** : 1.0
