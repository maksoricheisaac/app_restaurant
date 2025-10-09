# Module Inventaire V2 - Simplifié et Optimisé

## 🎯 Objectif

Module d'inventaire simplifié, rapide et visuel, adapté au fonctionnement réel des restaurants et bars congolais.

## ✨ Fonctionnalités Principales

### 1. **Actions Rapides Inline**
- ➕ **Ajouter au stock** : Bouton direct dans le tableau
- ➖ **Retirer du stock** : Bouton direct dans le tableau  
- ⚙ **Ajuster le stock** : Correction manuelle rapide
- Pas de formulaires complexes, tout se fait en 2 clics

### 2. **Codes Couleur Visuels**
- 🟢 **Stock OK** : Fond vert, stock suffisant
- 🟡 **Stock Bas** : Fond jaune, alerte de réapprovisionnement
- 🔴 **Rupture** : Fond rouge, stock épuisé

### 3. **Conversion Pack/Unité Automatique**
- Champ `packSize` pour définir le nombre d'unités par pack
- Exemple : 1 pack Primus = 12 bouteilles
- Lors de l'ajout/retrait, choix entre unités ou packs
- Conversion automatique en arrière-plan

### 4. **Notifications Temps Réel (Pusher)**
- Mise à jour instantanée du stock sur tous les écrans
- Notifications toast lors des changements
- Synchronisation automatique entre utilisateurs

### 5. **Statistiques en Direct**
- Total produits
- Nombre de produits en stock bas
- Nombre de produits en rupture
- Valeur totale du stock

### 6. **Filtrage Rapide**
- Recherche par nom ou fournisseur
- Filtre par catégorie (Boisson, Ingrédient, etc.)
- Filtre par statut (Tous, Stock bas, Rupture)

### 7. **Intégration Automatique**
- Décrémentation automatique lors des ventes
- Lien avec les commandes
- Lien avec la caisse

## 📁 Fichiers Créés

### Actions Serveur
- `src/actions/admin/inventory-quick-actions.ts` : Actions rapides simplifiées

### Composants
- `src/components/customs/admin/inventory/quick-inventory-table.tsx` : Tableau principal avec actions inline

### Pages
- `app/admin/inventory-v2/page.tsx` : Page principale du nouveau module

### Documentation
- `INVENTAIRE_V2_README.md` : Ce fichier

## 🔧 Installation

### 1. Appliquer la migration Prisma

```bash
npx prisma migrate dev --name add_inventory_v2_fields
```

Cette migration ajoute les champs suivants au modèle `Ingredient` :
- `packSize` (Int?) : Nombre d'unités dans un pack
- `category` (String?) : Catégorie du produit

### 2. Générer les types Prisma

```bash
npx prisma generate
```

### 3. Redémarrer le serveur

```bash
npm run dev
```

## 🚀 Utilisation

### Accéder au module
Naviguer vers `/admin/inventory-v2` ou cliquer sur "Inventaire" dans le menu admin.

### Ajouter un produit
1. Cliquer sur "Nouveau Produit"
2. Remplir les champs essentiels :
   - Nom
   - Catégorie
   - Unité
   - Prix unitaire
   - Stock initial (optionnel)
   - Stock minimum pour alerte (optionnel)
   - Taille du pack si applicable (ex: 12 pour un pack de 12)

### Actions rapides sur un produit

#### Ajouter au stock (➕)
1. Cliquer sur le bouton vert "+"
2. Entrer la quantité
3. Cocher "En packs" si vous ajoutez des packs entiers
4. Confirmer

#### Retirer du stock (➖)
1. Cliquer sur le bouton rouge "-"
2. Entrer la quantité
3. Cocher "En packs" si vous retirez des packs entiers
4. Confirmer

#### Ajuster le stock (⚙)
1. Cliquer sur le bouton bleu "⚙"
2. Entrer le nouveau stock exact
3. Confirmer

### Exemple : Gestion des boissons

**Produit : Primus 72cl**
- Nom : Primus 72cl
- Catégorie : Boisson
- Unité : unité
- Prix : 500 FCFA
- Stock min : 24
- Pack size : 12

**Scénario 1 : Réception de 5 packs**
1. Clic sur ➕
2. Quantité : 5
3. Cocher "En packs"
4. Confirmer → Stock augmente de 60 unités (5 × 12)

**Scénario 2 : Vente de 3 bouteilles**
1. Clic sur ➖
2. Quantité : 3
3. Ne pas cocher "En packs"
4. Confirmer → Stock diminue de 3 unités

**Scénario 3 : Inventaire physique**
1. Clic sur ⚙
2. Compter physiquement : 45 bouteilles
3. Entrer : 45
4. Confirmer → Stock ajusté à 45

## 🔗 Intégration avec les Commandes

Le système décrémente automatiquement le stock lors de la validation d'une commande contenant des boissons.

Voir `src/actions/admin/inventory-actions.ts` → `decrementStockForOrder`

## 📊 Notifications Pusher

Tous les changements de stock déclenchent une notification Pusher sur le canal `restaurant-channel` avec l'événement `stock-updated`.

Structure de l'événement :
```javascript
{
  ingredientId: string,
  name: string,
  newStock: number,
  type: 'IN' | 'OUT' | 'ADJUST',
  quantity: number
}
```

## 🎨 Codes Couleur

| Statut | Couleur | Condition |
|--------|---------|-----------|
| 🟢 OK | Vert | `stock > minStock` |
| 🟡 Bas | Jaune | `stock <= minStock` |
| 🔴 Rupture | Rouge | `stock <= 0` |

## 💡 Conseils d'Utilisation

1. **Définir des stocks minimums** : Permet d'avoir des alertes automatiques
2. **Utiliser les catégories** : Facilite le filtrage (Boisson, Ingrédient, etc.)
3. **Configurer les pack sizes** : Essentiel pour les boissons vendues en packs
4. **Faire des inventaires réguliers** : Utiliser l'ajustement pour corriger les écarts
5. **Vérifier les alertes** : Les produits en stock bas apparaissent en premier

## 🔄 Migration depuis l'ancien module

L'ancien module (`/admin/inventory`) reste accessible pour référence.

Pour migrer vos données :
1. Les produits existants sont automatiquement disponibles
2. Ajouter manuellement les champs `category` et `packSize` si nécessaire
3. Utiliser la fonction d'ajustement pour corriger les stocks si besoin

## 🐛 Dépannage

### Le stock ne se met pas à jour
- Vérifier que Pusher est configuré
- Vérifier la console pour les erreurs
- Rafraîchir la page

### Erreur "Stock insuffisant"
- Vérifier le stock actuel du produit
- Utiliser l'ajustement pour corriger si nécessaire

### Les packs ne fonctionnent pas
- Vérifier que `packSize` est défini pour le produit
- Éditer le produit pour ajouter la taille du pack

## 📝 Notes Techniques

- **Sans rechargement de page** : Toutes les actions utilisent React Query
- **Optimistic updates** : L'UI se met à jour immédiatement
- **Validation côté serveur** : Toutes les actions sont validées avec Zod
- **Transactions Prisma** : Garantit la cohérence des données
- **Type-safe** : TypeScript pour éviter les erreurs

## 🎯 Prochaines Améliorations Possibles

- [ ] Export Excel des stocks
- [ ] Historique détaillé des mouvements par produit
- [ ] Graphiques d'évolution du stock
- [ ] Prévisions de réapprovisionnement
- [ ] Scanner de codes-barres
- [ ] Gestion multi-dépôts
