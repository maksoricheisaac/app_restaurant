# 📘 Documentation complète de l'application Flash Menu

## 1. Vue d'ensemble

### Description globale
Flash Menu est une application web complète de gestion de restaurant moderne, développée avec Next.js 16. Elle permet aux clients de commander en ligne (sur place, à emporter ou en livraison) et au personnel du restaurant de gérer toutes les opérations quotidiennes via un panneau d'administration robuste.

### Objectif métier
L'application vise à digitaliser l'ensemble du fonctionnement d'un restaurant africain, depuis la prise de commande client jusqu'à la gestion des stocks, en passant par les réservations et les paiements. Elle offre une expérience utilisateur fluide pour les clients et des outils puissants pour le personnel.

### Type d'utilisateurs
- **Clients** : Utilisateurs finaux qui consultent le menu, passent des commandes et suivent leur statut
- **Personnel (8 rôles)** : Admin, Owner, Manager, Head Chef, Chef, Waiter, Cashier, User
- **Visiteurs** : Utilisateurs non connectés qui peuvent naviguer sur le site public

---

## 2. Architecture du projet

### Structure des dossiers

```
frontend/
├── app/                      # Next.js App Router
│   ├── (public)/            # Routes publiques
│   │   ├── about/           # Page à propos
│   │   ├── contact/         # Formulaire de contact
│   │   ├── gallery/         # Galerie photos
│   │   ├── menu/            # Menu public
│   │   ├── order-tracking/  # Suivi de commande
│   │   └── page.tsx         # Page d'accueil
│   ├── admin/               # Panel d'administration
│   │   ├── dashboard/       # Tableau de bord
│   │   ├── orders/          # Gestion des commandes
│   │   ├── cash-register/   # Caisse
│   │   ├── customers/       # Gestion clients
│   │   ├── tables/          # Gestion tables & QR
│   │   ├── menu/            # Gestion menu
│   │   ├── inventory-v2/    # Inventaire
│   │   ├── categories/      # Catégories
│   │   ├── reservations/    # Réservations
│   │   ├── reports/         # Rapports
│   │   ├── messages/        # Messages
│   │   └── settings/        # Paramètres
│   ├── login/               # Page de connexion
│   ├── register/            # Page d'inscription
│   ├── layout.tsx           # Layout racine
│   └── globals.css          # Styles globaux
├── src/
│   ├── actions/             # Server Actions
│   │   ├── admin/          # Actions admin (14 fichiers)
│   │   └── public/         # Actions publiques (6 fichiers)
│   ├── components/          # Composants React
│   │   ├── admin/          # Composants admin (20)
│   │   ├── admin_v2/       # Composants admin v2 (9)
│   │   ├── customs/        # Composants personnalisés (118)
│   │   │   ├── admin/     # Composants admin customs (82)
│   │   │   └── public/    # Composants public customs (36)
│   │   ├── ui/             # Composants UI shadcn (53)
│   │   └── layout/         # Composants layout
│   ├── contexts/            # React Context
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   └── AdminNotificationContext.tsx
│   ├── hooks/               # Custom Hooks
│   │   ├── usePermissions.ts
│   │   ├── useRole.ts
│   │   ├── usePusher.ts
│   │   └── use-file-upload.ts
│   ├── lib/                 # Utilitaires
│   │   ├── auth.ts         # Configuration better-auth
│   │   ├── auth-client.ts  # Client auth React
│   │   ├── auth-helpers.ts # Helpers authentification
│   │   ├── prisma.ts       # Client Prisma
│   │   ├── pusher.ts       # Configuration Pusher
│   │   └── utils.ts        # Utilitaires généraux
│   ├── config/              # Configuration
│   │   ├── admin-navigation.ts
│   │   └── rate-limits.ts
│   ├── schemas/             # Schémas Zod
│   ├── types/               # Types TypeScript
│   └── utils/               # Fonctions utilitaires
├── prisma/
│   ├── schema.prisma        # Schéma base de données
│   └── migrations/          # Migrations Prisma
├── public/                  # Assets statiques
└── package.json            # Dépendances
```

### Organisation technique

**Stack technique :**
- **Framework** : Next.js 16.1.1 (App Router)
- **Langage** : TypeScript 5
- **Base de données** : PostgreSQL avec Prisma ORM 6.16.2
- **Authentification** : better-auth 1.2.12
- **UI** : Radix UI + shadcn/ui + Tailwind CSS 4
- **State management** : TanStack Query 5.81.5 + React Context
- **Formulaires** : React Hook Form 7.60.0 + Zod 3.25.74
- **Temps réel** : Pusher 5.2.0
- **Drag & Drop** : @dnd-kit
- **Charts** : Recharts, Chart.js, react-chartjs-2
- **Gestionnaire de packages** : pnpm

---

## 3. Modules fonctionnels

### Module 1 : Gestion des commandes
**Description** : Cœur du système, permet la création, le suivi et la gestion des commandes clients.

**Fonctionnalités :**
- Création de commandes (sur place, à emporter, livraison)
- Suivi en temps réel du statut (pending → preparing → ready → served)
- Gestion des articles de commande
- Calcul automatique des totaux et frais de livraison
- Historique des commandes par utilisateur
- Limitation des commandes par heure (configurable)

**Règles métier :**
- Validation des prix côté serveur
- Vérification de la disponibilité des tables (dine_in)
- Vérification des zones de livraison (delivery)
- Décrémentation automatique du stock (boissons uniquement)
- Rate limiting par IP et par utilisateur

### Module 2 : Gestion du menu
**Description** : Administration complète du menu restaurant.

**Fonctionnalités :**
- CRUD complet sur les items du menu
- Organisation par catégories
- Gestion des images
- Marquage des items (épicé, populaire, végétarien)
- Gestion de la disponibilité
- Recettes (ingrédients par plat)

**Règles métier :**
- Permissions spécifiques par rôle (admin/owner/manager/head_chef pour modification)
- Validation des prix positifs
- Catégorisation obligatoire

### Module 3 : Inventaire & Stock
**Description** : Gestion des ingrédients et des mouvements de stock.

**Fonctionnalités :**
- Gestion des ingrédients (nom, unité, prix, stock, fournisseur)
- Définition des stocks minimums
- Recettes (association ingrédients → plats)
- Mouvements de stock (IN, OUT, ADJUST)
- Alertes stock bas
- Décrémentation automatique à la préparation
- Historique des mouvements

**Règles métier :**
- Gestion de stock uniquement pour les boissons (logique spécifique)
- Transaction Prisma pour garantir la cohérence
- Vérification stock suffisant avant décrémentation
- Mouvements tracés avec utilisateur et commande associés

### Module 4 : Réservations
**Description** : Système de réservation de tables.

**Fonctionnalités :**
- Création de réservations (client ou staff)
- Gestion des statuts (pending, confirmed, cancelled)
- Association avec tables
- Informations client (nom, email, téléphone, convives)
- Notes et demandes spéciales

**Règles métier :**
- Validation email et téléphone
- Nombre de convives positif
- Notifications temps réel via Pusher

### Module 5 : Caisse & Paiements
**Description** : Point de vente et gestion des transactions.

**Fonctionnalités :**
- Encaissement des commandes
- Gestion des paiements (cash uniquement pour l'instant)
- Transactions (vente, remboursement, ajustement)
- Rapports de caisse
- Suivi des caissiers
- Bilan quotidien

**Règles métier :**
- Association paiement/commande (1:1)
- Historique complet des transactions
- Permissions restreintes (cashier+)

### Module 6 : Tables & QR Code
**Description** : Gestion des tables du restaurant et génération de QR codes.

**Fonctionnalités :**
- CRUD sur les tables (numéro, places, emplacement)
- Statuts de table (available, occupied, reserved)
- Génération de QR codes par table
- Association commandes/tables
- Association réservations/tables

**Règles métier :**
- Numéro de table unique
- Vérification disponibilité avant commande dine_in

### Module 7 : Clients
**Description** : Gestion de la base clients.

**Fonctionnalités :**
- Liste des clients avec informations
- Historique des commandes par client
- Statut client (active, banned)
- Notes sur les clients
- Compteurs de commandes

**Règles métier :**
- Email unique
- Possibilité de bannissement avec raison et expiration

### Module 8 : Paramètres restaurant
**Description** : Configuration globale du restaurant.

**Fonctionnalités :**
- Informations générales (nom, réseaux sociaux)
- Horaires d'ouverture par jour
- Fermetures exceptionnelles
- Zones de livraison (prix, temps, minimum)
- Limitations de commandes (par heure, par utilisateur)
- Gestion du personnel

**Sous-modules :**
- **Horaires** : 7 jours, configurable, fermeture possible
- **Livraison** : Zones polygonales, frais, temps de livraison
- **Personnel** : CRUD staff, assignation rôles, suppression soft

### Module 9 : Messages & Contact
**Description** : Formulaire de contact et gestion des messages.

**Fonctionnalités :**
- Formulaire de contact public
- Liste des messages admin
- Statuts (new, read, archived)
- Priorités
- Sources (contact-form, email, etc.)

### Module 10 : Rapports
**Description** : Analyses et statistiques.

**Fonctionnalités :**
- Statistiques dashboard (commandes, revenus, clients)
- Rapports de ventes
- Rapports d'inventaire
- Export PDF (pdf-lib)

---

## 4. Backend

### API Routes
L'application utilise principalement **Server Actions** (Next.js) plutôt que des API routes traditionnelles. Les actions sont situées dans `src/actions/` :

**Actions publiques (`src/actions/public/`) :**
- `category-actions.ts` : Récupération des catégories
- `contact-action.ts` : Soumission formulaire contact
- `menu-actions.ts` : Récupération du menu public
- `order-actions.ts` : Création commandes clients, suivi statut
- `order-history-actions.ts` : Historique commandes utilisateur
- `order-tracking-actions.ts` : Suivi en temps réel

**Actions admin (`src/actions/admin/`) :**
- `cash-register-actions.ts` : Opérations caisse
- `category-actions.ts` : Gestion catégories
- `customer-actions.ts` : Gestion clients
- `dashboard-actions.ts` : Statistiques dashboard
- `inventory-actions.ts` : Inventaire complet
- `inventory-quick-actions.ts` : Actions rapides inventaire
- `menu-actions.ts` : Gestion menu
- `message-actions.ts` : Gestion messages
- `order-actions.ts` : Gestion commandes admin
- `permissions-actions.ts` : Gestion permissions
- `report-actions.ts` : Génération rapports
- `reservation-actions.ts` : Gestion réservations
- `settings-actions.ts` : Paramètres restaurant
- `table-actions.ts` : Gestion tables

### Logique métier

**Validation :**
- Schémas Zod pour toutes les entrées
- Validation côté serveur obligatoire
- Vérification des permissions avant chaque action

**Sécurité :**
- Helpers d'authentification (`requireAuth`, `requireStaff`, `requireRole`)
- Vérification des rôles et permissions
- Rate limiting configuré (non implémenté complètement)
- Whitelist d'IPs

**Transactions :**
- Utilisation de Prisma transactions pour opérations critiques
- Exemple : décrémentation stock + création mouvement

### Accès base de données (Prisma)

**Modèles principaux :**
- `User` : Utilisateurs (clients et staff)
- `Session` : Sessions better-auth
- `Account` : Comptes OAuth
- `Order` : Commandes
- `OrderItem` : Articles de commande
- `MenuItem` : Items du menu
- `MenuCategory` : Catégories
- `Table` : Tables restaurant
- `Reservation` : Réservations
- `Ingredient` : Ingrédients inventaire
- `Recipe` : Recettes (plats ↔ ingrédients)
- `StockMovement` : Mouvements de stock
- `Payment` : Paiements
- `Transaction` : Transactions caisse
- `DeliveryZone` : Zones de livraison
- `OpeningHours` : Horaires d'ouverture
- `ExceptionalClosure` : Fermetures exceptionnelles
- `RestaurantSettings` : Paramètres globaux
- `Message` : Messages contact
- `Report` : Rapports générés
- `RolePermission` : Permissions par rôle
- `UserPermission` : Permissions individuelles

**Enums :**
- `TableStatus` : available, occupied, reserved
- `ReservationStatus` : pending, confirmed, cancelled
- `OrderStatus` : pending, preparing, ready, served, cancelled
- `OrderType` : dine_in, takeaway, delivery
- `PaymentMethod` : cash
- `PaymentStatus` : completed, refunded, cancelled
- `TransactionType` : sale, refund, adjustment
- `Permission` : 32 permissions différentes
- `DayOfWeek` : monday à sunday
- `StockMovementType` : IN, OUT, ADJUST

### Gestion des erreurs
- Try/catch dans toutes les actions
- Messages d'erreur explicites en français
- Logging console pour debug
- Gestion des erreurs Zod

### Sécurité (auth, permissions)

**Authentification (better-auth) :**
- Email/password
- OAuth Google (configuré)
- Sessions avec token
- Support utilisateurs anonymes
- Plugin admin
- Plugin anonymous

**Rôles (8 rôles) :**
1. `admin` : Tous les droits
2. `owner` : Tous les droits
3. `manager` : Gestion complète sauf permissions staff
4. `head_chef` : Menu, inventaire, commandes
5. `chef` : Menu (lecture), inventaire, commandes
6. `waiter` : Commandes, tables, réservations, clients
7. `cashier` : Commandes, clients, caisse, rapports
8. `user` : Aucun droit admin

**Permissions (32 permissions) :**
Organisées en catégories :
- Dashboard (2)
- Commandes (5)
- Menu (4)
- Tables (2)
- Réservations (4)
- Clients (2)
- Caisse (4)
- Inventaire (3)
- Personnel (3)
- Paramètres (2)
- Messages (2)

**Contrôle d'accès :**
- Vérification au niveau des actions serveur
- Composants de protection frontend (`PermissionGuard`, `RoleGuard`)
- Navigation conditionnelle selon permissions

---

## 5. Frontend

### Pages (Next.js App Router)

**Pages publiques (`app/(public)/`) :**
- `/` : Page d'accueil (Hero, Stats, Featured Dishes, About, Testimonials, CTA)
- `/about` : Page à propos
- `/contact` : Formulaire de contact
- `/gallery` : Galerie photos
- `/menu` : Menu interactif avec panier
- `/order-tracking/[id]` : Suivi de commande
- `/login` : Connexion
- `/register` : Inscription

**Pages admin (`app/admin/`) :**
- `/admin/dashboard` : Tableau de bord avec stats
- `/admin/orders` : Liste et gestion commandes
- `/admin/cash-register` : Caisse
- `/admin/customers` : Gestion clients
- `/admin/tables` : Gestion tables + QR codes
- `/admin/menu` : Gestion menu
- `/admin/inventory-v2` : Inventaire
- `/admin/categories` : Gestion catégories
- `/admin/reservations` : Gestion réservations
- `/admin/reports` : Rapports
- `/admin/messages` : Messages
- `/admin/settings` : Paramètres restaurant

### Composants

**Composants UI (shadcn/ui - 53 composants) :**
- Composants Radix UI stylisés
- Button, Input, Card, Dialog, Sheet, etc.
- Composants data : Table, Pagination, Select
- Composants feedback : Alert, Toast (Sonner), Skeleton

**Composants customs admin (82) :**
- Dashboard widgets
- Tableaux de données personnalisés
- Formulaires complexes
- Cartes statistiques
- Composants de gestion (order-card, table-card, etc.)

**Composants customs public (36) :**
- Hero section
- Menu items
- Cart drawer
- Checkout form
- Order tracking
- Testimonials
- Gallery

**Composants layout :**
- `AppSidebar` : Navigation admin
- `Header` : En-tête admin
- `SiteHeader` : En-tête public
- `ThemeProvider` : Thème clair/sombre

### UX / UI

**Design :**
- Theme par défaut : Light
- Couleur primaire : Orange (#f97316)
- Police : Inter (Google Fonts)
- Responsive mobile-first
- Animations avec Tailwind

**Expérience utilisateur :**
- Panier persistant (localStorage)
- Notifications toast (Sonner)
- Loading states
- Confirmations dialog
- Formulaires avec validation temps réel
- Navigation fluide

### Gestion des états

**React Context :**
- `AuthContext` : État authentification (session utilisateur)
- `CartContext` : État panier (items, table, totaux)
- `AdminNotificationContext` : Notifications admin temps réel

**TanStack Query :**
- Cache des données serveur
- Invalidation automatique après mutations
- Loading et error states
- Refetch on window focus

**LocalStorage :**
- Panier (items, tableId, tableNumber)
- Préférences utilisateur
- État UI persistant

### Navigation

**Navigation admin :**
- Sidebar rétractable
- Badges de notification (pending orders, messages, reservations)
- Navigation conditionnelle par permission
- Breadcrumbs

**Navigation publique :**
- Navbar responsive
- Liens vers sections
- Boutons d'action (Commander, Réserver)

---

## 6. Authentification & Permissions

### Fonctionnement détaillé

**Inscription :**
- Formulaire email/password/nom
- Création via better-auth API
- Rôle par défaut : `user`
- Email verification (configuré mais non activé)

**Connexion :**
- Email/password ou Google OAuth
- Session stockée côté serveur
- Token JWT pour les requêtes
- Session persistante via cookies

**Sessions :**
- Table `session` en base
- Expiration configurable
- Support multi-device
- IP et user agent tracés

**Utilisateurs anonymes :**
- Support via better-auth plugin
- ID temporaire
- Limitation des fonctionnalités
- Conversion possible en compte réel

### Gestion des sessions

**Côté serveur :**
- Vérification via `auth.api.getSession(headers)`
- Helpers : `requireAuth()`, `requireStaff()`, `requireRole()`
- Middleware pour routes protégées

**Côté client :**
- Hook `useSession()` de better-auth
- Context AuthContext (legacy, partiellement utilisé)
- Redirection automatique si non authentifié

### Rôles et permissions

**Matrice des permissions :**

| Rôle | Dashboard | Commandes | Menu | Tables | Réservations | Clients | Caisse | Inventaire | Personnel | Settings | Messages |
|------|-----------|-----------|------|--------|--------------|---------|--------|------------|-----------|----------|----------|
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manager | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | ✓ |
| Head Chef | ✓ | ✓ (update) | ✓ | - | - | - | - | ✓ | - | - | - |
| Chef | ✓ | ✓ (update) | R | - | - | - | - | R | - | - | - |
| Waiter | ✓ | ✓ (create) | R | ✓ | ✓ | ✓ | - | - | - | - | - |
| Cashier | ✓ | ✓ (create) | R | - | - | ✓ | ✓ | - | - | - | - |
| User | - | - | - | - | - | - | - | - | - | - | - |

Légende : ✓ = tous droits, R = lecture seule, - = aucun accès

### Sécurité des accès

**Côté serveur :**
- Vérification obligatoire dans chaque action
- Helpers réutilisables
- Erreur 401/403 explicites

**Côté client :**
- Composants `ProtectedRoute` et `PermissionGuard`
- Masquage des liens de navigation
- Redirection si accès non autorisé

**Données sensibles :**
- Mots de passe hashés (better-auth)
- Tokens non exposés au client
- IP tracking pour utilisateurs anonymes

---

## 7. Flux de données

### Schéma explicatif

**Flux de commande client :**

```
1. Client navigue sur le menu public
   ↓
2. Ajoute des items au panier (CartContext + localStorage)
   ↓
3. Sélectionne le type de commande (dine_in/takeaway/delivery)
   ↓
4. Pour dine_in : scanne QR code ou sélectionne table
   ↓
5. Pour delivery : sélectionne zone et adresse
   ↓
6. Soumet la commande (createOrder action)
   ↓
7. Server Action valide :
   - Authentification utilisateur
   - Rate limiting (IP et utilisateur)
   - Limites restaurant (maxOrdersPerHour)
   - Disponibilité table (si dine_in)
   - Zone de livraison (si delivery)
   - Prix des items
   ↓
8. Création en base de données (transaction Prisma) :
   - Order + OrderItems
   - Mise à jour table status (si dine_in)
   ↓
9. Notification Pusher :
   - Channel "restaurant-channel" → "new-order"
   - Channel "admin-orders" → "new-order"
   ↓
10. Dashboard admin se met à jour en temps réel
    ↓
11. Staff change le statut (pending → preparing)
    ↓
12. Décrémentation automatique du stock (boissons)
    ↓
13. Notification Pusher au client
    ↓
14. Client suit le statut sur page order-tracking
```

**Flux de paiement :**

```
1. Commande prête à payer
   ↓
2. Caissier ouvre la commande dans Caisse
   ↓
3. Sélectionne le moyen de paiement (cash)
   ↓
4. Enregistre le paiement (createPayment action)
   ↓
5. Création Payment + Transaction en base
   ↓
6. Mise à jour statut commande (si non déjà servi)
   ↓
7. Notification Pusher
   ↓
8. Mise à jour dashboard caisse
```

**Flux de réservation :**

```
1. Client ou staff crée une réservation
   ↓
2. Validation des données (email, téléphone, date, convives)
   ↓
3. Création Reservation en base
   ↓
4. Association table (si spécifiée)
   ↓
5. Notification Pusher
   ↓
6. Staff confirme ou refuse
   ↓
7. Mise à jour statut
   ↓
8. Notification client (email - non implémenté)
```

### Transformations

**Données frontend → backend :**
- Validation Zod
- Transformation des types (string → number, Date)
- Normalisation des enums
- Calculs (totaux, frais)

**Données backend → frontend :**
- Sérialisation (Date → string)
- Filtrage des champs sensibles
- Inclusion des relations (includes Prisma)
- Pagination

### Dépendances

**Dépendances cycliques :**
- Order ↔ OrderItem (relation 1:N)
- Order ↔ User (relation N:1)
- Order ↔ Table (relation N:1)
- MenuItem ↔ MenuCategory (relation N:1)
- MenuItem ↔ Recipe ↔ Ingredient (relation N:M)

**Cascades :**
- Suppression utilisateur → suppression sessions, orders
- Suppression catégorie → suppression items menu
- Suppression item menu → suppression orderItems

---

## 8. Points forts

### Bonnes pratiques

**Architecture :**
- Séparation claire frontend/backend (Server Actions)
- Organisation modulaire des composants
- Utilisation de TypeScript strict
- Schéma de base de données bien structuré

**Sécurité :**
- Authentification robuste (better-auth)
- Système de permissions granulaire
- Validation côté serveur obligatoire
- Protection contre les injections (Prisma)

**UX :**
- Interface responsive et moderne
- Feedback utilisateur (toasts, loading states)
- Navigation intuitive
- Temps réel (Pusher)

**Performance :**
- TanStack Query pour le cache
- Optimistic updates
- Pagination des listes
- Lazy loading des composants

**Code quality :**
- Hooks personnalisés réutilisables
- Composants UI cohérents (shadcn/ui)
- Gestion d'erreurs centralisée
- Logging pour debug

**Fonctionnalités :**
- Système complet de gestion restaurant
- Workflow commande fluide
- Gestion des stocks avancée
- Rapports et statistiques

### Éléments bien conçus

**Système de permissions :**
- 32 permissions granulaires
- Matrice de rôles claire
- Facilement extensible

**Gestion du panier :**
- Persistant (localStorage)
- Context React pour partage d'état
- Calculs automatiques des totaux

**Inventaire :**
- Recettes pour lien menu ↔ stock
- Décrémentation automatique
- Historique complet des mouvements

**Notifications temps réel :**
- Pusher pour mises à jour instantanées
- Canaux séparés (admin, public)
- Gestion d'erreur silencieuse

**Server Actions :**
- Type-safe avec Zod
- Validation automatique
- Erreurs explicites

---

## 9. Points faibles / risques

### Dette technique

**AuthContext legacy :**
- `src/contexts/AuthContext.tsx` contient du code de démonstration avec utilisateurs hardcodés
- Non utilisé en production (better-auth utilisé à la place)
- À supprimer pour éviter la confusion

**Rate limiting incomplet :**
- Configuré mais non implémenté dans `order-actions.ts`
- Commentaire TODO présent
- Risque de surcharge en production

**Gestion des erreurs :**
- Certains catch renvoient des erreurs génériques
- Pas de système de monitoring d'erreurs
- Logging console uniquement (pas Sentry ou similaire)

**Tests :**
- Aucun test unitaire ou d'intégration détecté
- Risque de régressions
- Difficile de refactoriser en confiance

### Complexité

**Nombre de composants :**
- 118 composants customs
- 53 composants UI
- Difficile à maintenir sans documentation
- Risque de duplication

**Actions serveur :**
- 20 fichiers d'actions
- Certaines actions très longues (settings-actions.ts : 608 lignes)
- Logique métier dispersée

**Types TypeScript :**
- Certains types dupliqués (order.ts vs schema.prisma)
- Types générés Prisma vs types manuels
- Risque d'incohérence

### Incohérences

**Gestion du stock :**
- Décrémentation uniquement pour les boissons (logique spécifique hardcoded)
- Commentaire indique que c'est temporaire
- Pourquoi pas pour tous les plats ?

**Payment method :**
- Enum `PaymentMethod` ne contient que "cash"
- Pourquoi avoir un enum avec une seule valeur ?
- Suggère que d'autres méthodes étaient prévues

**User roles :**
- Certains rôles non utilisés dans les permissions (ex: "kitchen" dans settings)
- Incohérence entre rôles définis et rôles utilisés

**Authentification :**
- Deux systèmes coexistent (AuthContext legacy + better-auth)
- Confusion potentielle pour les développeurs

**Données de démonstration :**
- Utilisateurs de démo dans AuthContext
- Données hardcodées
- Risque de laisser en production

### Risques

**Sécurité :**
- Pas de rate limiting fonctionnel
- Pas de protection CSRF explicite
- Pas de limitation de tentatives de connexion
- IP tracking mais pas de blocage

**Performance :**
- Pas de cache Redis ou similaire
- Requêtes Prisma potentiellement lourdes (includes multiples)
- Pas d'indexation explicite dans le schema Prisma

**Scalabilité :**
- Architecture monolithique
- Pas de séparation des services
- Pusher comme dépendance externe (SPOF)

**Données :**
- Pas de backup automatique
- Pas de migration de données documentée
- Risque de perte de données

---

## 10. Recommandations

### Améliorations possibles

**Court terme :**
1. **Supprimer AuthContext legacy** - Nettoyer le code non utilisé
2. **Implémenter le rate limiting** - Compléter la fonctionnalité de sécurité
3. **Ajouter des tests** - Commencer par les actions critiques (order, payment)
4. **Documenter les composants** - Ajouter JSDoc aux composants complexes
5. **Centraliser la gestion d'erreurs** - Créer un handler d'erreurs uniforme

**Moyen terme :**
1. **Refactor settings-actions.ts** - Découper en fichiers plus petits
2. **Unifier les types** - Utiliser uniquement les types générés Prisma
3. **Ajouter un monitoring** - Intégrer Sentry ou LogRocket
4. **Implémenter d'autres moyens de paiement** - Carte bancaire, mobile money
5. **Ajouter des emails** - Confirmation de commande, réservation, inscription

**Long terme :**
1. **Architecture microservices** - Séparer les services critiques (commandes, paiements)
2. **Cache Redis** - Pour les données fréquemment accédées (menu, tables)
3. **Search engine** - Meilisearch ou Algolia pour la recherche menu
4. **Mobile app** - React Native ou PWA pour les clients
5. **Analytics avancés** - Intégration avec Google Analytics ou Mixpanel

### Refactoring

**Actions serveur :**
- Découper `settings-actions.ts` en modules :
  - `personnel-actions.ts`
  - `opening-hours-actions.ts`
  - `delivery-zones-actions.ts`
  - `general-settings-actions.ts`
- Extraire la logique de validation dans des fonctions réutilisables
- Créer des middleware pour les permissions

**Composants :**
- Fusionner les composants dupliqués
- Créer des composants génériques (DataTable, FormContainer)
- Extraire la logique métier dans des hooks personnalisés

**Types :**
- Supprimer les types manuels dupliqués
- Utiliser les types Prisma générés
- Créer des types utilitaires pour les transformations

### Optimisations

**Performance :**
- Ajouter des indexes Prisma sur les champs fréquemment queryés
- Implémenter le cache React Query pour les données statiques
- Lazy loading des routes admin
- Optimiser les images (next/image)

**Sécurité :**
- Implémenter le rate limiting avec Redis
- Ajouter une limite de tentatives de connexion
- Implémenter la vérification email
- Ajouter des headers de sécurité (CSP, HSTS)

**UX :**
- Ajouter le skeleton loading pour toutes les listes
- Optimiser le formulaire de commande (autosave)
- Ajouter des raccourcis clavier pour le staff
- Améliorer le design mobile

---

## 11. Conclusion

### État global du projet

Flash Menu est une application de gestion de restaurant **complète et fonctionnelle** avec un architecture moderne et des fonctionnalités avancées. Le code est globalement bien structuré et suit les bonnes pratiques du développement web actuel.

**Forces principales :**
- Stack technique moderne et performante (Next.js 16, Prisma, better-auth)
- Fonctionnalités complètes (commandes, menu, inventaire, réservations, caisse)
- Système de permissions granulaire et bien pensé
- Interface utilisateur moderne et responsive
- Temps réel via Pusher
- Code type-safe avec TypeScript

**Faiblesses principales :**
- Absence de tests
- Rate limiting non implémenté
- Code legacy à nettoyer (AuthContext)
- Actions serveur parfois trop longues
- Pas de monitoring d'erreurs
- Gestion du stock limitée aux boissons

**Maturité :**
- L'application est **production-ready** pour un petit restaurant
- Nécessite des améliorations pour une utilisation à grande échelle
- Documentation technique absente (comblée par ce document)
- Tests et monitoring recommandés avant déploiement critique

**Recommandation finale :**
Flash Menu est une **solide base** pour un système de gestion de restaurant. Avec les améliorations recommandées (tests, monitoring, rate limiting), elle peut être déployée en production avec confiance. L'architecture est suffisamment flexible pour évoluer vers une solution plus robuste et scalable.

---

**Document généré le 13 avril 2026**
**Version : 1.0**
**Analyste : Cascade AI**
