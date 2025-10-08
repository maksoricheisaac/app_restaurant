# 🥤 Gestion de Stock - Boissons Uniquement

## ✅ Correction Effectuée

### Erreur Corrigée
**Erreur TypeScript** :
```
'orderItem.menuItem' is possibly 'null'
```

**Solution** : Ajout d'une vérification de nullité avant d'accéder à `menuItem`.

---

## 🎯 Implémentation

### Principe
La gestion automatique de stock est **activée uniquement pour les boissons** lors de la validation d'une commande.

### Fichier Modifié
`src/actions/admin/inventory-actions.ts` - Fonction `decrementStockForOrder`

---

## 🔍 Logique de Filtrage

### Détection des Boissons
Un article est considéré comme une boisson si le nom de sa catégorie contient :
- `"boisson"` (français)
- `"drink"` (anglais)
- `"beverage"` (anglais)

```typescript
const isBeverage = orderItem.menuItem.category.name.toLowerCase().includes('boisson') ||
                  orderItem.menuItem.category.name.toLowerCase().includes('drink') ||
                  orderItem.menuItem.category.name.toLowerCase().includes('beverage');
```

### Exemples de Catégories Valides
- ✅ "Boissons"
- ✅ "Boissons Chaudes"
- ✅ "Boissons Froides"
- ✅ "Drinks"
- ✅ "Soft Drinks"
- ✅ "Beverages"
- ❌ "Plats" (ignoré)
- ❌ "Desserts" (ignoré)
- ❌ "Entrées" (ignoré)

---

## 📋 Flux de Traitement

### 1. Récupération de la Commande
```typescript
const order = await prisma.order.findUnique({
  where: { id: orderId },
  include: {
    orderItems: {
      include: {
        menuItem: {
          include: {
            category: true,  // ✅ Catégorie pour filtrage
            Recipe: {
              include: {
                ingredient: true
              }
            }
          }
        }
      }
    }
  }
});
```

### 2. Vérifications de Sécurité
Pour chaque article de commande :

1. **Vérification menuItem** :
   ```typescript
   if (!orderItem.menuItem) {
     console.warn(`MenuItem non trouvé pour orderItem ${orderItem.id}`);
     continue; // Passer à l'article suivant
   }
   ```

2. **Vérification catégorie (boisson)** :
   ```typescript
   if (!isBeverage) {
     console.log(`Article ${orderItem.name} ignoré (pas une boisson)`);
     continue; // Ignorer les non-boissons
   }
   ```

3. **Vérification recette** :
   ```typescript
   if (!orderItem.menuItem.Recipe || orderItem.menuItem.Recipe.length === 0) {
     console.warn(`Aucune recette trouvée pour la boisson ${orderItem.name}`);
     continue; // Pas de recette = pas de décrémentation
   }
   ```

### 3. Décrémentation du Stock
Pour chaque ingrédient de la recette :

1. **Calcul de la quantité** :
   ```typescript
   const totalQuantity = recipe.quantity * orderItem.quantity;
   ```

2. **Vérification du stock disponible** :
   ```typescript
   if (ingredient.stock < totalQuantity) {
     throw new Error(`Stock insuffisant pour ${ingredient.name}`);
   }
   ```

3. **Création du mouvement de stock** :
   ```typescript
   const movement = await tx.stockMovement.create({
     data: {
       ingredientId: recipe.ingredientId,
       type: "OUT",
       quantity: totalQuantity,
       description: `Sortie automatique pour commande #${order.id} - ${orderItem.name} (Boisson)`,
       orderId: order.id,
       userId: order.userId
     }
   });
   ```

4. **Mise à jour du stock** :
   ```typescript
   await tx.ingredient.update({
     where: { id: recipe.ingredientId },
     data: {
       stock: {
         decrement: totalQuantity
       }
     }
   });
   ```

---

## 🎯 Déclenchement Automatique

### Quand ?
La décrémentation de stock est déclenchée automatiquement lors du changement de statut d'une commande vers **"served"** (servie).

### Fichier
`src/actions/admin/order-actions.ts` - Fonction `updateOrderStatus`

```typescript
// Décrémentation automatique du stock pour les boissons
if (shouldDecrementStock) {
  try {
    const { decrementStockForOrder } = await import("./inventory-actions");
    await decrementStockForOrder({ orderId });
    console.log(`Stock décrementé automatiquement pour la commande ${orderId}`);
  } catch (stockError) {
    console.error('Erreur lors de la décrementation du stock:', stockError);
    // L'erreur est loggée mais ne bloque pas la mise à jour du statut
  }
}
```

---

## 📊 Exemple Concret

### Commande
```json
{
  "id": "cmd-123",
  "orderItems": [
    {
      "name": "Coca-Cola",
      "quantity": 2,
      "menuItem": {
        "category": { "name": "Boissons" },
        "Recipe": [
          {
            "ingredientId": "ing-coca",
            "quantity": 1,
            "ingredient": { "name": "Coca-Cola 33cl", "stock": 50 }
          }
        ]
      }
    },
    {
      "name": "Pizza Margherita",
      "quantity": 1,
      "menuItem": {
        "category": { "name": "Plats" },
        "Recipe": [...]
      }
    }
  ]
}
```

### Résultat
- ✅ **Coca-Cola** : Stock décrementé de 2 unités (2 x 1)
- ❌ **Pizza Margherita** : Ignorée (pas une boisson)

### Mouvement de Stock Créé
```json
{
  "type": "OUT",
  "quantity": 2,
  "description": "Sortie automatique pour commande #cmd-123 - Coca-Cola (Boisson)",
  "ingredientId": "ing-coca",
  "orderId": "cmd-123"
}
```

---

## 🔧 Configuration Requise

### 1. Catégories de Menu
Assurez-vous d'avoir une catégorie pour les boissons :
```sql
INSERT INTO "MenuCategory" (id, name) VALUES 
  ('cat-boissons', 'Boissons');
```

### 2. Ingrédients
Créez des ingrédients pour les boissons :
```sql
INSERT INTO "Ingredient" (id, name, unit, stock, minStock) VALUES 
  ('ing-coca', 'Coca-Cola 33cl', 'unité', 100, 20),
  ('ing-sprite', 'Sprite 33cl', 'unité', 80, 20),
  ('ing-fanta', 'Fanta 33cl', 'unité', 90, 20);
```

### 3. Recettes
Liez les boissons à leurs ingrédients :
```sql
INSERT INTO "Recipe" (id, menuItemId, ingredientId, quantity) VALUES 
  ('rec-1', 'menu-coca', 'ing-coca', 1),
  ('rec-2', 'menu-sprite', 'ing-sprite', 1);
```

---

## 📝 Logs et Monitoring

### Logs Console
```
✅ Article Coca-Cola traité (boisson)
❌ Article Pizza Margherita ignoré (pas une boisson)
⚠️  Aucune recette trouvée pour la boisson Jus d'Orange
✅ Stock décrementé automatiquement pour la commande cmd-123
```

### Message de Retour
```json
{
  "success": true,
  "data": [...],
  "message": "3 mouvement(s) de stock créé(s) pour les boissons"
}
```

---

## 🚀 Avantages

1. **Sécurité** : Vérifications multiples avant décrémentation
2. **Flexibilité** : Facile d'étendre à d'autres catégories
3. **Traçabilité** : Tous les mouvements sont enregistrés
4. **Performance** : Transaction atomique pour cohérence
5. **Robustesse** : Les erreurs de stock ne bloquent pas la commande

---

## 🔮 Évolutions Futures

### Étendre à d'autres catégories
Pour activer la gestion de stock pour d'autres catégories :

```typescript
const needsStockManagement = 
  orderItem.menuItem.category.name.toLowerCase().includes('boisson') ||
  orderItem.menuItem.category.name.toLowerCase().includes('dessert') ||
  orderItem.menuItem.category.name.toLowerCase().includes('entrée');
```

### Gestion de stock par ingrédient
Activer/désactiver la gestion de stock au niveau de l'ingrédient :

```typescript
// Ajouter un champ dans le modèle Ingredient
trackStock: Boolean @default(true)

// Vérifier avant décrémentation
if (!ingredient.trackStock) {
  console.log(`Stock non géré pour ${ingredient.name}`);
  continue;
}
```

---

## ✅ Checklist de Test

- [ ] Créer une catégorie "Boissons"
- [ ] Créer des ingrédients (Coca, Sprite, etc.)
- [ ] Créer des items de menu boissons
- [ ] Lier les items aux ingrédients via Recipe
- [ ] Passer une commande avec des boissons
- [ ] Changer le statut de la commande à "served"
- [ ] Vérifier que le stock a été décrementé
- [ ] Vérifier les mouvements de stock dans l'inventaire
- [ ] Tester avec stock insuffisant
- [ ] Vérifier que les plats sont ignorés

---

## 🆘 Dépannage

### Le stock n'est pas décrementé
1. Vérifier que la catégorie contient "boisson"
2. Vérifier que les recettes existent
3. Vérifier les logs console
4. Vérifier que le statut est bien "served"

### Erreur "Stock insuffisant"
1. Augmenter le stock de l'ingrédient
2. Ou désactiver temporairement la gestion de stock
3. Vérifier les mouvements de stock précédents

### MenuItem null
1. Vérifier que les items de menu existent
2. Vérifier les relations dans Prisma
3. Régénérer le client Prisma : `pnpm prisma generate`
