# 🍽️ App_Restaurant - Système de Gestion de Restaurant

Application web complète de gestion de restaurant avec commande en ligne, suivi en temps réel et interface d'administration avancée.

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Fonctionnalités](#fonctionnalités)
3. [Technologies](#technologies)
4. [Architecture](#architecture)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Utilisation](#utilisation)
8. [API](#api)
9. [Déploiement](#déploiement)
10. [Contribution](#contribution)
11. [License](#license)

---

## 🎯 Vue d'Ensemble

**App_Restaurant** est une solution complète de gestion de restaurant développée avec les technologies web modernes. Elle permet de gérer l'ensemble des opérations d'un restaurant : commandes en ligne, gestion du menu, suivi des stocks, caisse, rapports, et bien plus.

### **Caractéristiques Principales**

- 🛒 **Commande en ligne** avec panier intelligent
- 📱 **Application web responsive** (mobile, tablette, desktop)
- ⚡ **Temps réel** avec notifications instantanées
- 👥 **Gestion multi-rôles** avec permissions granulaires
- 💳 **Paiement sécurisé** (espèces, carte, mobile money)
- 📊 **Rapports détaillés** et analytics
- 🔔 **Notifications push** pour le personnel
- 🌍 **Multilingue** (Français par défaut)
- 🎨 **Interface moderne** et intuitive

---

## ✨ Fonctionnalités

### **Côté Client**

#### **Navigation et Découverte**
- Page d'accueil attractive avec présentation du restaurant
- Menu interactif avec filtres et recherche
- Galerie photos des plats
- Page À propos et Contact
- Informations en temps réel (horaires, disponibilité)

#### **Commande en Ligne**
- Parcours d'achat fluide et intuitif
- Panier persistant (localStorage)
- Commande avec ou sans compte
- Choix du type : Sur place, À emporter, Livraison
- Calcul automatique des frais de livraison
- Validation en temps réel

#### **Suivi de Commande**
- Suivi en temps réel par numéro de commande
- Notifications push à chaque changement de statut
- Historique complet pour utilisateurs connectés
- Estimation du temps de préparation

#### **Compte Utilisateur**
- Inscription/Connexion sécurisée
- Profil personnalisable
- Historique des commandes
- Adresses enregistrées
- Plats favoris

### **Côté Administration**

#### **Tableau de Bord**
- Vue d'ensemble en temps réel
- Statistiques du jour (ventes, commandes, revenus)
- Graphiques et analytics
- Commandes récentes
- Alertes et notifications

#### **Gestion des Commandes**
- Création de commandes (comptoir, téléphone)
- Gestion du cycle de vie complet
- Statuts : En attente → En préparation → Prête → Servie
- Impression de tickets de cuisine
- Annulation avec justification
- Filtres avancés et recherche

#### **Gestion du Menu**
- CRUD complet des plats
- Catégorisation (Entrées, Plats, Desserts, Boissons)
- Upload d'images
- Gestion de la disponibilité
- Prix et descriptions
- Réorganisation par drag & drop

#### **Gestion des Tables**
- Plan de salle interactif
- Statuts en temps réel (Disponible, Occupée, Réservée)
- QR codes pour commande à table
- Capacité et emplacement
- Réservations

#### **Caisse**
- Traitement des paiements
- Modes multiples (Espèces, Carte, Mobile Money)
- Calcul automatique de la monnaie
- Ouverture/Fermeture de caisse
- Rapports de caisse détaillés
- Gestion des écarts

#### **Gestion des Clients**
- Base de données clients
- Historique des commandes par client
- Statuts (Normal, VIP, Inactif)
- Notes et préférences
- Segmentation

#### **Inventaire**
- Gestion des stocks
- Alertes de stock bas
- Mouvements de stock (Entrées, Sorties, Ajustements)
- Catégories de produits
- Fournisseurs
- Valorisation du stock

#### **Rapports et Analytics**
- Rapports de ventes (jour, semaine, mois)
- Analyse des performances
- Plats les plus vendus
- Heures de pointe
- Rapports financiers
- Export PDF/Excel

#### **Paramètres**
- Configuration générale du restaurant
- Horaires d'ouverture
- Zones et tarifs de livraison
- Limitations de commandes
- Réseaux sociaux
- Gestion du personnel
- Permissions et rôles

### **Système de Permissions**

#### **Rôles Disponibles**
1. **Admin** - Accès complet
2. **Owner** - Propriétaire
3. **Manager** - Gérant
4. **Head Chef** - Chef cuisinier
5. **Chef** - Cuisinier
6. **Waiter** - Serveur
7. **Cashier** - Caissier
8. **User** - Client

#### **Permissions Granulaires** (29 permissions)
- Dashboard (VIEW_DASHBOARD, VIEW_ANALYTICS)
- Commandes (VIEW, CREATE, UPDATE, DELETE, MANAGE_STATUS)
- Menu (VIEW, CREATE, UPDATE, DELETE)
- Tables (VIEW, MANAGE)
- Réservations (VIEW, CREATE, UPDATE, DELETE)
- Clients (VIEW, MANAGE)
- Caisse (VIEW, MANAGE_PAYMENTS, MANAGE_TRANSACTIONS, VIEW_REPORTS)
- Inventaire (VIEW, MANAGE, MANAGE_STOCK)
- Personnel (VIEW, MANAGE, MANAGE_PERMISSIONS)
- Paramètres (VIEW, MANAGE)
- Messages (VIEW, MANAGE)

---

## 🛠️ Technologies

### **Frontend**

#### **Framework et Librairies**
- **Next.js 14** - Framework React avec App Router
- **React 18** - Librairie UI
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utility-first
- **shadcn/ui** - Composants UI modernes

#### **State Management**
- **React Context** - État global
- **TanStack Query** - Gestion des requêtes serveur
- **Zustand** - État léger (panier)

#### **Formulaires et Validation**
- **React Hook Form** - Gestion des formulaires
- **Zod** - Validation de schémas

#### **UI/UX**
- **Framer Motion** - Animations
- **Lucide Icons** - Icônes
- **Sonner** - Notifications toast
- **date-fns** - Manipulation de dates

### **Backend**

#### **Framework**
- **Next.js API Routes** - API serverless
- **Server Actions** - Actions serveur typées

#### **Base de Données**
- **PostgreSQL** - Base de données relationnelle
- **Prisma ORM** - ORM moderne et type-safe

#### **Authentification**
- **Better Auth** - Solution d'authentification moderne
- **JWT** - Tokens sécurisés
- **Session Management** - Gestion des sessions

#### **Temps Réel**
- **Pusher** - WebSocket pour notifications temps réel
- **Server-Sent Events** - Streaming de données

### **Infrastructure**

#### **Déploiement**
- **Vercel** - Hébergement et déploiement
- **PostgreSQL Cloud** - Base de données managée

#### **Monitoring**
- **Sentry** - Tracking d'erreurs
- **Analytics** - Suivi des performances

#### **Storage**
- **Cloudinary** - Stockage et optimisation d'images
- **S3-compatible** - Stockage de fichiers

---

## 🏗️ Architecture

### **Structure du Projet**

```
app_restaurant/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Routes publiques
│   │   ├── page.tsx              # Page d'accueil
│   │   ├── menu/                 # Menu
│   │   ├── order-tracking/       # Suivi de commande
│   │   ├── about/                # À propos
│   │   ├── contact/              # Contact
│   │   └── gallery/              # Galerie
│   ├── admin/                    # Interface d'administration
│   │   ├── dashboard/            # Tableau de bord
│   │   ├── orders/               # Gestion des commandes
│   │   ├── menu/                 # Gestion du menu
│   │   ├── tables/               # Gestion des tables
│   │   ├── cash-register/        # Caisse
│   │   ├── customers/            # Clients
│   │   ├── inventory/            # Inventaire
│   │   ├── reports/              # Rapports
│   │   ├── settings/             # Paramètres
│   │   └── layout.tsx            # Layout admin
│   ├── api/                      # API Routes
│   │   └── auth/                 # Authentification
│   └── layout.tsx                # Layout racine
├── src/
│   ├── actions/                  # Server Actions
│   │   ├── admin/                # Actions admin
│   │   └── public/               # Actions publiques
│   ├── components/               # Composants React
│   │   ├── admin/                # Composants admin
│   │   ├── customs/              # Composants métier
│   │   ├── layout/               # Layout components
│   │   └── ui/                   # Composants UI (shadcn)
│   ├── contexts/                 # React Contexts
│   │   ├── AuthContext.tsx       # Authentification
│   │   ├── CartContext.tsx       # Panier
│   │   └── AdminNotificationContext.tsx
│   ├── hooks/                    # Custom Hooks
│   │   ├── usePermissions.ts     # Permissions
│   │   ├── useCart.ts            # Panier
│   │   └── queries/              # React Query hooks
│   ├── lib/                      # Utilitaires
│   │   ├── auth.ts               # Configuration auth
│   │   ├── prisma.ts             # Client Prisma
│   │   ├── pusherClient.ts       # Client Pusher
│   │   └── utils.ts              # Fonctions utilitaires
│   ├── types/                    # Types TypeScript
│   │   ├── permissions.ts        # Types permissions
│   │   ├── order.ts              # Types commandes
│   │   └── menu.ts               # Types menu
│   ├── config/                   # Configuration
│   │   └── admin-navigation.ts   # Navigation admin
│   └── generated/                # Code généré
│       └── prisma/               # Types Prisma
├── prisma/
│   ├── schema.prisma             # Schéma de base de données
│   └── migrations/               # Migrations
├── public/                       # Fichiers statiques
│   ├── images/                   # Images
│   └── icons/                    # Icônes
├── scripts/                      # Scripts utilitaires
│   └── init-permissions.ts       # Init permissions
├── .env.local                    # Variables d'environnement
├── next.config.js                # Configuration Next.js
├── tailwind.config.ts            # Configuration Tailwind
├── tsconfig.json                 # Configuration TypeScript
└── package.json                  # Dépendances
```

### **Flux de Données**

```
Client (Browser)
    ↓
Next.js Frontend (React Components)
    ↓
Server Actions / API Routes
    ↓
Prisma ORM
    ↓
PostgreSQL Database
    ↓
Pusher (Temps Réel)
    ↓
Client (Notifications)
```

### **Modèle de Données**

#### **Entités Principales**

**User** (Utilisateur)
- Authentification et profil
- Rôle et permissions
- Statut (actif, anonyme)

**Order** (Commande)
- Informations de commande
- Statut et type
- Relation avec User et Table

**OrderItem** (Article de commande)
- Détails des articles
- Quantité et prix
- Relation avec Order et MenuItem

**MenuItem** (Plat du menu)
- Informations du plat
- Prix et disponibilité
- Catégorie

**Category** (Catégorie)
- Organisation du menu
- Ordre d'affichage

**Table** (Table)
- Numéro et capacité
- Statut et emplacement
- QR code

**Payment** (Paiement)
- Montant et mode
- Statut et référence
- Relation avec Order

**Inventory** (Inventaire)
- Produits et stocks
- Alertes et mouvements

**Settings** (Paramètres)
- Configuration globale
- Horaires et zones

**RolePermission** (Permissions par rôle)
- Matrice rôle-permission

**UserPermission** (Permissions personnalisées)
- Permissions spécifiques par utilisateur

---

## 🚀 Installation

### **Prérequis**

- **Node.js** 18+ 
- **pnpm** (ou npm/yarn)
- **PostgreSQL** 14+
- **Git**

### **Étapes d'Installation**

#### **1. Cloner le Projet**
```bash
git clone https://github.com/votre-repo/resto-congo.git
cd resto-congo
```

#### **2. Installer les Dépendances**
```bash
pnpm install
```

#### **3. Configuration de l'Environnement**
Créez un fichier `.env.local` :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/App_Restaurant"

# Better Auth
BETTER_AUTH_SECRET="votre-secret-tres-long-et-securise"
BETTER_AUTH_URL="http://localhost:3000"

# Pusher (Temps Réel)
NEXT_PUBLIC_PUSHER_APP_KEY="votre-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="eu"
PUSHER_APP_ID="votre-app-id"
PUSHER_SECRET="votre-pusher-secret"

# Cloudinary (Images)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="votre-cloud-name"
CLOUDINARY_API_KEY="votre-api-key"
CLOUDINARY_API_SECRET="votre-api-secret"

# Email (Optionnel)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="votre-email@gmail.com"
SMTP_PASSWORD="votre-mot-de-passe"

# Autres
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

#### **4. Configuration de la Base de Données**

```bash
# Créer la base de données
createdb App_Restaurant

# Appliquer les migrations
npx prisma migrate dev

# Générer le client Prisma
npx prisma generate

# (Optionnel) Seed la base avec des données de test
npx prisma db seed
```

#### **5. Initialiser les Permissions**
```bash
npx tsx scripts/init-permissions.ts
```

#### **6. Lancer le Serveur de Développement**
```bash
pnpm dev
```

L'application sera accessible sur `http://localhost:3000`

---

## ⚙️ Configuration

### **Variables d'Environnement**

| Variable | Description | Requis |
|----------|-------------|--------|
| `DATABASE_URL` | URL de connexion PostgreSQL | ✅ |
| `BETTER_AUTH_SECRET` | Secret pour JWT | ✅ |
| `BETTER_AUTH_URL` | URL de l'application | ✅ |
| `NEXT_PUBLIC_PUSHER_APP_KEY` | Clé Pusher publique | ✅ |
| `PUSHER_SECRET` | Secret Pusher | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Nom cloud Cloudinary | ⚠️ |
| `SMTP_HOST` | Serveur SMTP | ⚠️ |

✅ = Requis | ⚠️ = Optionnel mais recommandé

### **Configuration du Restaurant**

Après installation, configurez votre restaurant :

1. Connectez-vous avec le compte admin par défaut
2. Allez dans **Paramètres**
3. Configurez :
   - Informations générales
   - Horaires d'ouverture
   - Zones de livraison
   - Réseaux sociaux

---

## 📖 Utilisation

### **Compte Admin par Défaut**

Après l'installation, utilisez :
- **Email** : `admin@resto-congo.cg`
- **Mot de passe** : `Admin123!`

⚠️ **Changez immédiatement ce mot de passe !**

### **Créer le Premier Plat**

1. Connectez-vous en tant qu'admin
2. Allez dans **Menu**
3. Cliquez sur **"Nouveau plat"**
4. Remplissez les informations
5. Uploadez une photo
6. Sauvegardez

### **Créer un Employé**

1. **Paramètres** → **Personnel**
2. Cliquez sur **"Ajouter un employé"**
3. Remplissez les informations
4. Choisissez le rôle
5. L'employé reçoit un email avec ses identifiants

### **Passer une Commande Test**

1. Allez sur la page d'accueil
2. Parcourez le menu
3. Ajoutez des plats au panier
4. Passez commande
5. Suivez la commande en temps réel

---

## 🔌 API

### **Endpoints Publics**

#### **Menu**
```typescript
GET /api/menu
// Récupère tous les plats disponibles

GET /api/menu/categories
// Récupère toutes les catégories
```

#### **Commandes**
```typescript
POST /api/orders
// Créer une nouvelle commande

GET /api/orders/:id
// Récupérer une commande par ID

GET /api/orders/track/:id
// Suivre une commande
```

### **Endpoints Admin** (Authentification requise)

#### **Commandes**
```typescript
GET /api/admin/orders
// Liste toutes les commandes

PATCH /api/admin/orders/:id/status
// Mettre à jour le statut

DELETE /api/admin/orders/:id
// Annuler une commande
```

#### **Menu**
```typescript
POST /api/admin/menu
// Créer un plat

PATCH /api/admin/menu/:id
// Modifier un plat

DELETE /api/admin/menu/:id
// Supprimer un plat
```

### **Server Actions**

Les Server Actions sont préférées aux API Routes pour :
- Type-safety complet
- Pas besoin de définir des routes
- Validation automatique avec Zod

Exemple :
```typescript
// src/actions/admin/order-actions.ts
export async function createOrder(data: OrderInput) {
  // Validation
  const validated = OrderSchema.parse(data);
  
  // Logique métier
  const order = await prisma.order.create({
    data: validated
  });
  
  // Notification temps réel
  await pusher.trigger('orders', 'new-order', order);
  
  return { success: true, data: order };
}
```

---

## 🚀 Déploiement

### **Déploiement sur Vercel** (Recommandé)

#### **1. Préparer le Projet**
```bash
# Build de production
pnpm build

# Test du build
pnpm start
```

#### **2. Déployer sur Vercel**

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

Ou via l'interface Vercel :
1. Connectez votre repo GitHub
2. Configurez les variables d'environnement
3. Déployez

#### **3. Configuration Post-Déploiement**

- Configurez la base de données PostgreSQL (Vercel Postgres ou Supabase)
- Ajoutez toutes les variables d'environnement
- Exécutez les migrations :
  ```bash
  npx prisma migrate deploy
  ```
- Initialisez les permissions

### **Déploiement Docker**

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN pnpm build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build
docker build -t resto-congo .

# Run
docker run -p 3000:3000 resto-congo
```

---

## 🧪 Tests

### **Tests Unitaires**
```bash
pnpm test
```

### **Tests E2E**
```bash
pnpm test:e2e
```

### **Linting**
```bash
pnpm lint
```

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📄 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 👥 Auteurs

- **MBOKA TECH** - Développement initial

---

## 🙏 Remerciements

- Next.js Team
- Vercel
- shadcn/ui
- Prisma Team
- Communauté Open Source

---

## 📞 Support

- 📧 Email : support@resto-congo.cg
- 📱 Téléphone : +242 06 XXX XX XX
- 💬 Discord : [Lien Discord]
- 📖 Documentation : [docs.resto-congo.cg]

---

**Fait avec ❤️ à Brazzaville, Congo**

---

**Version** : 1.0.0  
**Dernière mise à jour** : Octobre 2025
