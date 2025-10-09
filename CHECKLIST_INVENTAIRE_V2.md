# ✅ Checklist de Mise en Production - Inventaire V2

## 📋 Étapes à Suivre

### ☐ 1. Appliquer la Migration de Base de Données

```bash
npx prisma migrate dev --name add_inventory_v2_fields
```

**Vérification** : Les champs `packSize` et `category` doivent être ajoutés au modèle `Ingredient`

### ☐ 2. Générer les Types Prisma

```bash
npx prisma generate
```

**Vérification** : Aucune erreur TypeScript dans les fichiers créés

### ☐ 3. Redémarrer le Serveur de Développement

```bash
npm run dev
```

**Vérification** : Le serveur démarre sans erreur

### ☐ 4. Tester l'Accès au Module

1. Ouvrir : `http://localhost:3000/admin/inventory-v2`
2. Vérifier que la page se charge
3. Vérifier que les statistiques s'affichent (0 partout au début)

**Vérification** : ✅ Page accessible sans erreur

### ☐ 5. Créer un Produit de Test

1. Cliquer sur "Nouveau Produit"
2. Remplir :
   - Nom : "Test Primus 72cl"
   - Catégorie : "Boisson"
   - Unité : "unité"
   - Prix : 500
   - Stock min : 24
   - Pack size : 12
3. Créer

**Vérification** : ✅ Produit créé et visible dans le tableau

### ☐ 6. Tester l'Ajout de Stock

1. Cliquer sur le bouton vert ➕ du produit test
2. Entrer : 5
3. Cocher "En packs"
4. Confirmer

**Vérification** : ✅ Stock passe à 60 (5 × 12)

### ☐ 7. Tester le Retrait de Stock

1. Cliquer sur le bouton rouge ➖
2. Entrer : 10
3. Ne pas cocher "En packs"
4. Confirmer

**Vérification** : ✅ Stock passe à 50

### ☐ 8. Tester l'Ajustement de Stock

1. Cliquer sur le bouton bleu ⚙
2. Entrer : 100
3. Confirmer

**Vérification** : ✅ Stock ajusté à 100

### ☐ 9. Vérifier les Codes Couleur

1. Créer un produit avec stock = 0
2. Vérifier qu'il apparaît en 🔴 Rouge
3. Créer un produit avec stock ≤ minStock
4. Vérifier qu'il apparaît en 🟡 Jaune
5. Vérifier qu'un produit avec stock > minStock apparaît en 🟢 Vert

**Vérification** : ✅ Codes couleur fonctionnent

### ☐ 10. Tester les Filtres

1. Créer plusieurs produits de catégories différentes
2. Tester le filtre "Catégorie"
3. Tester le filtre "Stock" (Tous, Stock bas, Rupture)
4. Tester la recherche

**Vérification** : ✅ Filtres fonctionnent correctement

### ☐ 11. Vérifier les Notifications Pusher (Optionnel)

**Prérequis** : Pusher configuré dans `.env`

1. Ouvrir 2 onglets sur `/admin/inventory-v2`
2. Dans l'onglet 1 : Ajouter du stock
3. Dans l'onglet 2 : Vérifier que le stock se met à jour automatiquement

**Vérification** : ✅ Notifications en temps réel fonctionnent

### ☐ 12. Tester l'Intégration avec les Commandes

1. Créer une boisson dans le menu (avec recette liée au produit inventaire)
2. Passer une commande avec cette boisson
3. Valider la commande
4. Vérifier que le stock a diminué automatiquement

**Vérification** : ✅ Décrémentation automatique fonctionne

### ☐ 13. Vérifier les Permissions (Si système de permissions activé)

1. Se connecter avec un utilisateur "Manager"
2. Vérifier l'accès à `/admin/inventory-v2`
3. Se connecter avec un utilisateur "Waiter"
4. Vérifier que l'accès est refusé (si configuré ainsi)

**Vérification** : ✅ Permissions respectées

### ☐ 14. Tester sur Mobile

1. Ouvrir sur un smartphone ou réduire la fenêtre
2. Vérifier que l'interface est responsive
3. Tester les actions rapides sur mobile

**Vérification** : ✅ Interface mobile fonctionnelle

### ☐ 15. Nettoyer les Données de Test

1. Supprimer ou désactiver les produits de test
2. Ou : Garder et ajuster les stocks à 0

**Vérification** : ✅ Base de données propre

## 🎯 Mise en Production

### ☐ 16. Créer les Vrais Produits

Utiliser la liste de vos produits réels :
- Toutes les boissons avec leurs packs
- Tous les ingrédients
- Définir les stocks minimums appropriés

**Vérification** : ✅ Tous les produits créés

### ☐ 17. Faire l'Inventaire Initial

Pour chaque produit :
1. Compter physiquement le stock
2. Utiliser l'ajustement ⚙ pour définir le stock initial

**Vérification** : ✅ Stocks initiaux corrects

### ☐ 18. Former l'Équipe

1. Montrer au gérant : ➕➖⚙ et codes couleur
2. Expliquer au caissier : Stock automatique
3. Rassurer les serveurs : Rien à faire

**Vérification** : ✅ Équipe formée

### ☐ 19. Surveillance Premier Jour

1. Vérifier les stocks en fin de journée
2. Comparer avec l'inventaire physique
3. Ajuster si nécessaire

**Vérification** : ✅ Stocks cohérents

### ☐ 20. Optimisation Continue

1. Ajuster les stocks minimums selon la réalité
2. Ajouter de nouveaux produits au besoin
3. Former les nouveaux employés

**Vérification** : ✅ Système optimisé

## 🚨 Dépannage

### Problème : Migration échoue

**Solution** :
```bash
# Vérifier l'état de la base
npx prisma migrate status

# Si besoin, réinitialiser (ATTENTION : perte de données)
npx prisma migrate reset
npx prisma migrate dev
```

### Problème : Types TypeScript incorrects

**Solution** :
```bash
npx prisma generate
# Redémarrer le serveur
```

### Problème : Pusher ne fonctionne pas

**Solution** :
1. Vérifier `.env` : `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`
2. Vérifier que Pusher est bien importé
3. Vérifier la console navigateur pour les erreurs

### Problème : Stock ne se décrémente pas automatiquement

**Solution** :
1. Vérifier que la boisson a une recette liée à un ingrédient
2. Vérifier que la catégorie du menu contient "boisson"
3. Vérifier les logs serveur lors de la validation de commande

### Problème : Codes couleur ne s'affichent pas

**Solution** :
1. Vérifier que `minStock` est défini pour le produit
2. Vérifier que Tailwind CSS est bien configuré
3. Rafraîchir le cache du navigateur

## 📊 Métriques de Succès

Après 1 semaine d'utilisation :

- [ ] Temps d'inventaire réduit de 60%+
- [ ] Zéro rupture de stock non détectée
- [ ] Équipe adopte le système sans résistance
- [ ] Erreurs de stock réduites de 80%+
- [ ] Satisfaction du gérant : 9/10+

## 📞 Support

**Documentation** :
- `INVENTAIRE_V2_README.md` : Documentation complète
- `GUIDE_DEMARRAGE_INVENTAIRE_V2.md` : Guide pas à pas
- `INVENTAIRE_V2_RESUME.md` : Résumé exécutif

**Fichiers Techniques** :
- `src/actions/admin/inventory-quick-actions.ts` : Actions serveur
- `src/components/customs/admin/inventory/quick-inventory-table.tsx` : Composant tableau
- `app/admin/inventory-v2/page.tsx` : Page principale
- `src/types/inventory-v2.ts` : Types TypeScript

**Migration** :
- `migration-inventory-v2.sql` : Script SQL manuel

---

## ✨ Félicitations !

Une fois toutes les cases cochées, votre module Inventaire V2 est opérationnel et prêt pour la production ! 🎉

**Date de mise en production** : _______________

**Validé par** : _______________

**Notes** : 
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
