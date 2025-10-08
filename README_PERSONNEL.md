# 👨‍💼 App_Restaurant - Guide du Personnel

Guide complet pour l'utilisation du système de gestion du restaurant.

---

## 🎯 Table des Matières

1. [Rôles et Permissions](#rôles-et-permissions)
2. [Connexion](#connexion)
3. [Tableau de Bord](#tableau-de-bord)
4. [Gestion des Commandes](#gestion-des-commandes)
5. [Gestion du Menu](#gestion-du-menu)
6. [Gestion des Tables](#gestion-des-tables)
7. [Caisse](#caisse)
8. [Clients](#clients)
9. [Inventaire](#inventaire)
10. [Rapports](#rapports)
11. [Paramètres](#paramètres)

---

## 🔐 Rôles et Permissions

### **Hiérarchie des Rôles**

#### **1. Administrateur (Admin)**
- ✅ Accès complet à toutes les fonctionnalités
- ✅ Gestion du personnel
- ✅ Modification des paramètres système
- ✅ Accès aux rapports financiers
- ✅ Gestion des permissions

#### **2. Propriétaire (Owner)**
- ✅ Accès complet similaire à l'admin
- ✅ Vue d'ensemble de l'activité
- ✅ Rapports détaillés
- ✅ Gestion du personnel

#### **3. Gérant (Manager)**
- ✅ Gestion des commandes
- ✅ Gestion du menu
- ✅ Gestion des clients
- ✅ Rapports opérationnels
- ✅ Gestion des tables
- ❌ Pas d'accès aux paramètres système critiques

#### **4. Chef Cuisinier (Head Chef)**
- ✅ Gestion complète du menu
- ✅ Gestion de l'inventaire
- ✅ Consultation des commandes
- ✅ Gestion de l'équipe de cuisine
- ❌ Pas d'accès à la caisse

#### **5. Cuisinier (Chef)**
- ✅ Consultation des commandes
- ✅ Mise à jour du statut des commandes
- ✅ Consultation du menu
- ✅ Consultation de l'inventaire
- ❌ Pas de modification du menu

#### **6. Serveur (Waiter)**
- ✅ Création de commandes
- ✅ Gestion des tables
- ✅ Gestion des réservations
- ✅ Consultation des clients
- ❌ Pas d'accès aux rapports financiers

#### **7. Caissier (Cashier)**
- ✅ Gestion de la caisse
- ✅ Traitement des paiements
- ✅ Création de commandes
- ✅ Rapports de vente
- ❌ Pas de gestion du personnel

---

## 🔑 Connexion

### **Première Connexion**
1. Allez sur : `https://resto-congo.cg/login`
2. Utilisez les identifiants fournis par votre manager
3. **Changez votre mot de passe** lors de la première connexion

### **Identifiants**
- **Email** : Votre email professionnel
- **Mot de passe** : Minimum 8 caractères

### **Mot de Passe Oublié**
1. Cliquez sur "Mot de passe oublié"
2. Entrez votre email
3. Suivez le lien reçu par email
4. Créez un nouveau mot de passe

### **Sécurité**
- ⚠️ Ne partagez JAMAIS vos identifiants
- 🔒 Déconnectez-vous toujours après utilisation
- 🔐 Changez régulièrement votre mot de passe

---

## 📊 Tableau de Bord

### **Vue d'Ensemble**
Le tableau de bord affiche :
- 📈 **Statistiques du jour**
  - Nombre de commandes
  - Chiffre d'affaires
  - Commandes en attente
  - Commandes en préparation

- 📋 **Commandes Récentes**
  - Liste des dernières commandes
  - Statut en temps réel
  - Actions rapides

- 📅 **Sélection de Date**
  - Consultez les statistiques d'une date spécifique
  - Comparez les performances

### **Notifications en Temps Réel**
- 🔔 Nouvelle commande
- ⏰ Commande en retard
- ✅ Commande terminée
- ❌ Commande annulée

---

## 🛒 Gestion des Commandes

### **Créer une Commande**

#### **Commande au Comptoir**
1. Cliquez sur **"Nouvelle commande"**
2. Sélectionnez **"Comptoir"** comme client
3. Choisissez le type :
   - 🍽️ Sur place
   - 📦 À emporter
   - 🚚 Livraison
4. Ajoutez les articles :
   - Recherchez ou parcourez le menu
   - Ajustez les quantités
   - Ajoutez des notes spéciales
5. Sélectionnez une table (si sur place)
6. Validez la commande

#### **Commande pour Client Enregistré**
1. Recherchez le client par nom/email
2. Ses informations sont pré-remplies
3. Suivez les mêmes étapes

### **Gérer les Commandes**

#### **Statuts de Commande**
```
En attente → En préparation → Prête → Servie
                    ↓
                Annulée
```

#### **Actions Disponibles**

**🟡 En Attente**
- ✅ Valider (passe en "En préparation")
- ❌ Annuler
- 📝 Modifier
- 🖨️ Imprimer le ticket

**🔵 En Préparation**
- ✅ Marquer comme "Prête"
- ❌ Annuler (avec justification)
- 📝 Ajouter des notes

**🟣 Prête**
- ✅ Marquer comme "Servie"
- 🖨️ Réimprimer le ticket

**🟢 Servie**
- 📄 Voir les détails
- 🖨️ Imprimer la facture

### **Filtres et Recherche**
- 🔍 Recherche par numéro de commande
- 📅 Filtrer par date
- 🏷️ Filtrer par statut
- 🔄 Filtrer par type (sur place, à emporter, livraison)

### **Tickets de Cuisine**
- Impression automatique à la validation
- Format optimisé pour la cuisine
- Informations essentielles :
  - Numéro de commande
  - Type de commande
  - Table (si applicable)
  - Articles avec quantités
  - Notes spéciales
  - Heure de commande

---

## 🍽️ Gestion du Menu

### **Ajouter un Plat**
1. Allez dans **"Menu"**
2. Cliquez sur **"Nouveau plat"**
3. Remplissez les informations :
   - **Nom** : Nom du plat
   - **Description** : Description appétissante
   - **Prix** : Prix en FCFA
   - **Catégorie** : Entrée, Plat, Dessert, Boisson
   - **Image** : Photo du plat (recommandé)
   - **Disponibilité** : Actif/Inactif
4. Sauvegardez

### **Modifier un Plat**
1. Trouvez le plat dans la liste
2. Cliquez sur **"Modifier"**
3. Changez les informations nécessaires
4. Sauvegardez

### **Gérer la Disponibilité**
- **Marquer comme indisponible** : Plat temporairement en rupture
- **Supprimer** : Retirer définitivement du menu (attention !)

### **Catégories**
1. Allez dans **"Catégories"**
2. Créez/Modifiez les catégories
3. Organisez l'ordre d'affichage

### **Bonnes Pratiques**
- ✅ Photos de qualité (format carré, 800x800px minimum)
- ✅ Descriptions claires et appétissantes
- ✅ Prix à jour
- ✅ Marquer les plats indisponibles plutôt que les supprimer
- ✅ Organiser par catégories logiques

---

## 🪑 Gestion des Tables

### **Ajouter une Table**
1. Allez dans **"Tables & QR"**
2. Cliquez sur **"Nouvelle table"**
3. Remplissez :
   - **Numéro** : Numéro unique
   - **Capacité** : Nombre de places
   - **Emplacement** : Salle, Terrasse, VIP, etc.
   - **Statut** : Disponible/Occupée
4. Sauvegardez

### **QR Codes**
Chaque table a un QR code unique :
- 📱 Clients scannent pour voir le menu
- 🛒 Commande directe depuis la table
- 🖨️ Imprimez et plastifiez les QR codes

### **Gérer les Tables**
- **Marquer comme occupée** : Lors de l'installation des clients
- **Libérer** : Après le départ des clients
- **Réserver** : Pour les réservations
- **Modifier** : Changer capacité ou emplacement

### **Plan de Salle**
- Vue d'ensemble de toutes les tables
- Statut en temps réel
- Attribution rapide

---

## 💰 Caisse

### **Traiter un Paiement**
1. Sélectionnez la commande
2. Vérifiez le montant total
3. Choisissez le mode de paiement :
   - 💵 Espèces
   - 💳 Carte bancaire
   - 📱 Mobile Money
4. Entrez le montant reçu (si espèces)
5. Le système calcule la monnaie
6. Validez le paiement
7. Imprimez la facture

### **Modes de Paiement**
- **Espèces** : Calcul automatique de la monnaie
- **Carte** : Enregistrement du numéro de transaction
- **Mobile Money** : Référence de transaction
- **Compte Client** : Pour clients réguliers (à crédit)

### **Ouverture/Fermeture de Caisse**

#### **Ouverture**
1. Comptez le fond de caisse
2. Enregistrez le montant initial
3. Notez l'heure d'ouverture

#### **Fermeture**
1. Comptez la caisse
2. Le système compare avec les ventes
3. Justifiez les écarts si nécessaire
4. Imprimez le rapport de caisse
5. Validez la fermeture

### **Rapports de Caisse**
- 📊 Ventes par mode de paiement
- 💵 Total espèces
- 💳 Total cartes
- 📱 Total Mobile Money
- 📉 Écarts de caisse

---

## 👥 Gestion des Clients

### **Ajouter un Client**
1. Allez dans **"Clients"**
2. Cliquez sur **"Nouveau client"**
3. Remplissez :
   - Nom complet
   - Email
   - Téléphone
   - Adresse (pour livraisons)
   - Notes (allergies, préférences)
4. Sauvegardez

### **Fiche Client**
Chaque client a une fiche avec :
- 📋 Informations personnelles
- 📊 Historique des commandes
- 💰 Montant total dépensé
- ⭐ Statut (Normal, VIP)
- 📝 Notes et préférences

### **Statuts Client**
- **Normal** : Client régulier
- **VIP** : Client fidèle (avantages spéciaux)
- **Inactif** : N'a pas commandé depuis longtemps

### **Recherche**
- 🔍 Par nom
- 📧 Par email
- 📱 Par téléphone
- 🏷️ Par statut

---

## 📦 Inventaire

### **Gérer les Stocks**
1. Allez dans **"Inventaire"**
2. Consultez les niveaux de stock
3. Mettez à jour les quantités
4. Recevez des alertes pour stocks bas

### **Ajouter un Produit**
1. Cliquez sur **"Nouveau produit"**
2. Remplissez :
   - Nom du produit
   - Catégorie (Viandes, Légumes, Épices, etc.)
   - Unité de mesure (kg, L, unité)
   - Stock actuel
   - Stock minimum (alerte)
   - Prix d'achat
   - Fournisseur
3. Sauvegardez

### **Mouvements de Stock**
- **Entrée** : Réception de marchandises
- **Sortie** : Utilisation en cuisine
- **Ajustement** : Correction d'inventaire
- **Perte** : Produits périmés/abîmés

### **Alertes**
- 🔴 Stock critique (< minimum)
- 🟡 Stock bas (proche du minimum)
- 📅 Produits proches de la péremption

---

## 📈 Rapports

### **Rapports Disponibles**

#### **Rapport de Ventes**
- Ventes par jour/semaine/mois
- Ventes par catégorie
- Plats les plus vendus
- Heures de pointe

#### **Rapport Financier**
- Chiffre d'affaires
- Moyenne par commande
- Répartition par mode de paiement
- Évolution dans le temps

#### **Rapport de Performance**
- Temps moyen de préparation
- Taux d'annulation
- Satisfaction client
- Performance du personnel

#### **Rapport d'Inventaire**
- Valeur du stock
- Mouvements de stock
- Produits en rupture
- Coût des marchandises vendues

### **Exporter les Rapports**
- 📄 PDF
- 📊 Excel
- 📧 Envoi par email

---

## ⚙️ Paramètres

### **Paramètres Généraux**
- Nom du restaurant
- Coordonnées
- Horaires d'ouverture
- Types de service (sur place, à emporter, livraison)

### **Horaires d'Ouverture**
1. Allez dans **"Paramètres" → "Horaires"**
2. Définissez pour chaque jour :
   - Heure d'ouverture
   - Heure de fermeture
   - Fermé (si applicable)
3. Ajoutez des fermetures exceptionnelles

### **Zones de Livraison**
1. **"Paramètres" → "Livraisons"**
2. Ajoutez les zones :
   - Nom de la zone
   - Prix de livraison
   - Actif/Inactif
3. Sauvegardez

### **Limitations**
- Commandes maximum par heure
- Commandes maximum par utilisateur/heure
- Montant minimum de commande

### **Réseaux Sociaux**
Ajoutez vos liens :
- Facebook
- Instagram
- Twitter
- TikTok
- YouTube

### **Personnel** (Admin/Owner uniquement)
1. **"Paramètres" → "Personnel"**
2. Gérez les comptes :
   - Ajouter un employé
   - Modifier les informations
   - Changer le rôle
   - Désactiver un compte
3. Définissez les permissions personnalisées

---

## 🔔 Notifications

### **Types de Notifications**
- 🆕 Nouvelle commande
- ✅ Commande validée
- 🍳 Commande en préparation
- 📦 Commande prête
- 🚚 Commande livrée
- ❌ Commande annulée

### **Paramètres de Notification**
- Son activé/désactivé
- Notifications desktop
- Notifications par email

---

## 📱 Application Mobile

### **Accès Mobile**
- Responsive sur tous les appareils
- Ajoutez à l'écran d'accueil pour un accès rapide
- Fonctionne hors ligne (mode limité)

---

## 🆘 Support et Aide

### **Problèmes Courants**

#### **Je ne peux pas me connecter**
- Vérifiez votre email et mot de passe
- Utilisez "Mot de passe oublié"
- Contactez votre manager

#### **Une commande n'apparaît pas**
- Rafraîchissez la page (F5)
- Vérifiez les filtres appliqués
- Vérifiez votre connexion internet

#### **L'imprimante ne fonctionne pas**
- Vérifiez qu'elle est allumée
- Vérifiez la connexion
- Vérifiez le papier
- Contactez le support technique

#### **Je n'ai pas accès à une fonctionnalité**
- Vérifiez vos permissions avec votre manager
- Certaines fonctions sont réservées à certains rôles

### **Contact Support**
- 📧 **Email** : support@resto-congo.cg
- 📱 **Téléphone** : +242 06 XXX XX XX
- 💬 **Chat** : Disponible dans l'application

---

## ✅ Bonnes Pratiques

### **Sécurité**
- 🔒 Déconnectez-vous toujours
- 🔐 Ne partagez pas vos identifiants
- 👀 Vérifiez toujours les montants
- 💾 Sauvegardez régulièrement

### **Efficacité**
- ⚡ Utilisez les raccourcis clavier
- 📋 Préparez les commandes à l'avance
- 🔄 Mettez à jour les statuts rapidement
- 📊 Consultez les rapports régulièrement

### **Service Client**
- 😊 Soyez courtois et professionnel
- ⏱️ Respectez les délais
- 📝 Notez les préférences clients
- 🎯 Visez l'excellence

---

## 📚 Formation

### **Nouveaux Employés**
1. Formation initiale (2 heures)
2. Accompagnement (1 semaine)
3. Évaluation
4. Formation continue

### **Ressources**
- 📖 Ce guide
- 🎥 Vidéos tutorielles
- 👨‍🏫 Formation en présentiel
- 💬 Support continu

---

**Bienvenue dans l'équipe App_Restaurant ! 🎉**

*Ensemble, offrons la meilleure expérience culinaire à nos clients.*

---

**Dernière mise à jour** : Octobre 2025  
**Version** : 1.0.0
