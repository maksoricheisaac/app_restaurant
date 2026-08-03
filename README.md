# Flash Menu

Logiciel de gestion pour **un restaurant**. Carte publique et commande en ligne
côté client ; salle, cuisine, caisse, stock et réservations côté équipe.

Ce n'est pas une plateforme multi-établissement : la base décrit un seul
restaurant, et c'est une contrainte de la base de données, pas une convention
de code. Voir [ADR-007](apps/docs/adr/007-mono-etablissement.md).

---

## Ce que fait le logiciel

| Pour les clients | Pour l'équipe |
|---|---|
| Carte publique (`/menu`), consultable par QR code de table | Prise de commande en salle et à la caisse |
| Commande en ligne : sur place, à emporter, livraison | Écran cuisine (KDS) en temps réel |
| Réservation de table | Sessions de caisse avec réconciliation |
| Suivi de commande en direct | Stock et recettes (décrément automatique) |
| Site vitrine (horaires, contact) | Réservations, clients, rapports |

Rôles : **propriétaire**, **manager**, **serveur**, **chef**, **caissier**.

---

## Structure

```
apps/
├── backend/     API NestJS + Prisma/PostgreSQL + Socket.IO   → README dédié
├── frontend/    Next.js 16 (App Router) + Tailwind           → README dédié
├── docs/        ADR, guide de migration, gestion des secrets
├── docker-compose.yml       pile complète (prod)
└── docker-compose.dev.yml   surcharges de dev — à combiner avec le fichier ci-dessus
```

Chaque application a son propre `pnpm-lock.yaml` : ce ne sont pas des
workspaces d'un monorepo unique, on installe dans chaque dossier.

---

## Démarrage rapide

**Prérequis :** Node 22, pnpm 10, PostgreSQL 16 (Redis facultatif).

```bash
# 1. Base de données seule (ou utilisez votre PostgreSQL local)
docker compose -f apps/docker-compose.yml up -d postgres redis

# 2. Backend
cd apps/backend
cp .env.example .env          # renseignez DATABASE_URL et JWT_SECRET
pnpm install
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm start:dev                # → http://localhost:4000

# 3. Frontend (autre terminal)
cd apps/frontend
pnpm install
pnpm dev                      # → http://localhost:3000
```

Ouvrez ensuite **http://localhost:3000/setup** : l'assistant de première
installation crée l'établissement, le compte propriétaire, les permissions par
défaut, les horaires et la carte initiale — en une seule transaction, et une
seule fois. Il ne réapparaît plus ensuite.

### Tout lancer sous Docker

`docker-compose.dev.yml` est un fichier de **surcharges**, pas une pile
autonome : il se combine avec le fichier de base.

```bash
cd apps
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Ports — attention à l'inversion

Ils ne sont **pas les mêmes** en local et sous Docker. C'est une source
d'erreur connue (elle avait faussé la configuration Playwright) :

| | Backend | Frontend |
|---|---|---|
| Développement local | **4000** (`PORT` du `.env`) | **3000** (`next dev -p 3000`) |
| Docker Compose | **3000** | **4000** |

---

## Commandes courantes

Depuis `apps/backend` :

```bash
pnpm start:dev        # API en watch
pnpm test             # tests unitaires (Jest)
pnpm lint:ci          # lint sans correction automatique
pnpm build            # compile vers dist/ (entrée : dist/main.js)
pnpm db:reset         # ⚠️ vide la base et réinstalle un établissement de démo
pnpm seed-owner       # (re)crée le compte propriétaire — dev uniquement
```

Depuis `apps/frontend` :

```bash
pnpm dev              # serveur de développement
pnpm test             # tests unitaires (Vitest)
pnpm test:e2e         # Playwright (backend + frontend doivent tourner)
pnpm lint:ci
pnpm build
```

### Lancer la suite end-to-end en local

Playwright vise `localhost:3000` (frontend) et, pour les appels API,
`E2E_API_URL`. En local, le backend écoutant sur 4000 :

```bash
# backend démarré, frontend démarré, base contenant les données de test
cd apps/backend && pnpm seed-test

cd apps/frontend
E2E_API_URL=http://localhost:4000/api/v1 pnpm test:e2e
```

La suite est dense : elle peut franchir la limite de débit (30 requêtes/minute,
5 connexions/minute). En cas de `429` en cascade, redémarrez le backend — le
compteur est en mémoire tant que `REDIS_URL` n'est pas configuré.

---

## Première installation en production

1. `prisma migrate deploy` sur une base vierge.
2. Démarrer backend et frontend.
3. Ouvrir `/setup` et suivre les cinq étapes.

Il n'existe **aucune inscription publique**. Les autres membres de l'équipe
sont ajoutés depuis l'administration, par invitation par email.

### Vous migrez depuis la version multi-établissement ?

Lisez **[apps/docs/MIGRATION_SINGLE_RESTAURANT.md](apps/docs/MIGRATION_SINGLE_RESTAURANT.md)**
avant toute chose. La migration est **destructive et irréversible** : elle
conserve un seul établissement et supprime les données de tous les autres.

---

## Sécurité — trois choses à savoir

**Le jeton d'accès ne porte que l'identité** (`{ sub, email }`). Le rôle est
relu en base à chaque requête : une rétrogradation ou une désactivation prend
effet immédiatement, sans attendre l'expiration du jeton.

**L'unicité de l'établissement est garantie par PostgreSQL**
(`CHECK (id = 'restaurant')`), pas par le code. Une seconde installation, même
en appel concurrent, est rejetée par la base.

**Les prix sont toujours relus en base** au moment de la commande. Le prix
envoyé par le client n'est jamais cru sur parole.

Inventaire des secrets et impact de leur rotation :
[apps/docs/SECRETS.md](apps/docs/SECRETS.md).

---

## Documentation

| Document | Sujet |
|---|---|
| [Présentation](apps/docs/PRESENTATION.md) | Ce que fait le logiciel, écran par écran — description produit complète |
| [ADR-001](apps/docs/adr/001-auth-architecture.md) | Authentification : middleware, guards, jetons |
| [ADR-003](apps/docs/adr/003-websocket-architecture.md) | Temps réel : Socket.IO, salons, événements |
| [ADR-005](apps/docs/adr/005-redis-scaling-strategy.md) | Redis : limitation de débit multi-instance |
| [ADR-006](apps/docs/adr/006-backups-and-deploy-rollback.md) | Sauvegardes et retour arrière |
| [ADR-007](apps/docs/adr/007-mono-etablissement.md) | Passage au mono-établissement |
| [Migration](apps/docs/MIGRATION_SINGLE_RESTAURANT.md) | Procédure SaaS → mono-établissement |
| [Rapport de refonte](apps/docs/REFONTE_MONO_ETABLISSEMENT.md) | Avant/après détaillé, mesures |

---

## Intégration continue

`.github/workflows/ci.yml` — Node 22, pnpm 10. Lint, typecheck, tests
unitaires et build sur les deux applications.
