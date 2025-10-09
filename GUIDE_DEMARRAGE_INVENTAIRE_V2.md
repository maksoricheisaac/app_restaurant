# 🚀 Guide de Démarrage Rapide - Inventaire V2

## Étape 1 : Appliquer la Migration

### Option A : Avec Prisma Migrate (Recommandé)

```bash
npx prisma migrate dev --name add_inventory_v2_fields
npx prisma generate
```

### Option B : Avec SQL Direct

```bash
# Se connecter à votre base de données PostgreSQL
psql -U votre_utilisateur -d votre_base

# Exécuter le fichier SQL
\i migration-inventory-v2.sql
```

## Étape 2 : Redémarrer le Serveur

```bash
npm run dev
```

## Étape 3 : Accéder au Module

Ouvrir votre navigateur et aller à :
```
http://localhost:3000/admin/inventory-v2
```

## Étape 4 : Créer Votre Premier Produit

### Exemple : Primus 72cl

1. Cliquer sur **"Nouveau Produit"**
2. Remplir le formulaire :
   - **Nom** : Primus 72cl
   - **Catégorie** : Boisson
   - **Unité** : unité
   - **Prix unitaire** : 500 FCFA
   - **Stock initial** : 0
   - **Stock minimum** : 24
   - **Taille du pack** : 12
   - **Fournisseur** : Bralima
3. Cliquer sur **"Créer le produit"**

### Exemple : Skol 33cl

1. Cliquer sur **"Nouveau Produit"**
2. Remplir :
   - **Nom** : Skol 33cl
   - **Catégorie** : Boisson
   - **Unité** : unité
   - **Prix unitaire** : 400 FCFA
   - **Stock initial** : 0
   - **Stock minimum** : 36
   - **Taille du pack** : 24
   - **Fournisseur** : Bralima
3. Créer

## Étape 5 : Ajouter du Stock

### Scénario : Réception de 10 packs de Primus

1. Trouver "Primus 72cl" dans le tableau
2. Cliquer sur le bouton vert **➕**
3. Entrer **10** dans "Quantité"
4. **Cocher** "En packs"
5. Cliquer sur **"Confirmer"**

✅ Résultat : Stock passe à 120 unités (10 × 12)

### Scénario : Vente de 5 bouteilles

1. Trouver "Primus 72cl"
2. Cliquer sur le bouton rouge **➖**
3. Entrer **5**
4. **Ne pas cocher** "En packs"
5. Confirmer

✅ Résultat : Stock passe à 115 unités

## Étape 6 : Faire un Inventaire Physique

### Scénario : Vous comptez 98 bouteilles de Primus

1. Trouver "Primus 72cl"
2. Cliquer sur le bouton bleu **⚙**
3. Entrer **98** dans "Nouveau stock"
4. Confirmer

✅ Résultat : Stock ajusté à 98 unités

## 📊 Comprendre les Codes Couleur

| Indicateur | Signification | Action |
|------------|---------------|--------|
| 🟢 OK | Stock suffisant | Rien à faire |
| 🟡 Bas | Stock ≤ minimum | Commander bientôt |
| 🔴 Rupture | Stock = 0 | Commander urgent ! |

## 🔍 Utiliser les Filtres

### Voir uniquement les produits en stock bas
1. Cliquer sur le menu déroulant "Stock"
2. Sélectionner "🟡 Stock bas"

### Voir uniquement les boissons
1. Cliquer sur le menu déroulant "Catégorie"
2. Sélectionner "Boisson"

### Rechercher un produit
1. Taper dans la barre de recherche
2. Exemples : "Primus", "Bralima", "Coca"

## 🔔 Notifications en Temps Réel

Lorsqu'un utilisateur modifie le stock, **tous les autres utilisateurs** voient la mise à jour instantanément grâce à Pusher.

Exemple :
- Le gérant ajoute 5 packs de Skol
- Le caissier voit immédiatement le nouveau stock sur son écran
- Une notification toast apparaît : "📦 Stock mis à jour: Skol 33cl"

## 💡 Astuces Pro

### 1. Définir des Stocks Minimums Intelligents
- **Boissons populaires** : 2-3 jours de vente
- **Boissons moyennes** : 1 semaine de vente
- **Boissons rares** : 1-2 packs minimum

### 2. Utiliser les Catégories
- **Boisson** : Toutes les boissons
- **Ingrédient** : Huile, farine, épices, etc.
- **Autre** : Emballages, serviettes, etc.

### 3. Faire des Inventaires Réguliers
- **Quotidien** : Boissons à forte rotation
- **Hebdomadaire** : Autres produits
- Utiliser l'ajustement ⚙ pour corriger

### 4. Surveiller la Valeur du Stock
- Carte "Valeur Stock" en haut de page
- Indicateur de l'argent immobilisé
- Aide à optimiser les commandes

## 🔗 Intégration Automatique

### Avec les Commandes
Quand un client commande une boisson :
1. La commande est validée
2. Le stock est **automatiquement décrémenté**
3. Un mouvement de stock "OUT" est créé
4. Notification Pusher envoyée

### Avec la Caisse
Quand le caissier encaisse :
1. Le paiement est enregistré
2. Si la commande contient des boissons
3. Le stock a déjà été décrémenté à la validation
4. Rien à faire manuellement !

## ❓ FAQ

### Q : Que se passe-t-il si j'ajoute 5 packs mais le packSize n'est pas défini ?
**R :** Le système ajoute 5 unités (pas 5 × packSize). Définissez toujours le packSize pour les produits vendus en packs.

### Q : Puis-je modifier le packSize après création ?
**R :** Oui, mais cela n'affecte pas les mouvements passés, seulement les futurs.

### Q : Comment voir l'historique des mouvements ?
**R :** Pour l'instant, utilisez l'ancien module `/admin/inventory` onglet "Mouvements". Une version simplifiée sera ajoutée prochainement.

### Q : Le stock peut-il être négatif ?
**R :** Non, le système empêche les retraits qui rendraient le stock négatif.

### Q : Comment supprimer un produit ?
**R :** Pour l'instant, désactivez-le dans l'ancien module. Une fonction de suppression sera ajoutée.

## 🆘 Besoin d'Aide ?

1. Consultez `INVENTAIRE_V2_README.md` pour la documentation complète
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que Pusher est configuré dans `.env`

## 🎉 Vous êtes Prêt !

Votre module d'inventaire simplifié est opérationnel. Profitez de la rapidité et de la simplicité !

**Prochaines étapes recommandées :**
1. Créer tous vos produits
2. Définir les stocks minimums
3. Faire un inventaire initial
4. Former votre équipe aux actions rapides ➕ ➖ ⚙
