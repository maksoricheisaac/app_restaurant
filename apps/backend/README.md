# Flash Menu — API

API NestJS 11 du logiciel de gestion. PostgreSQL via Prisma 7, temps réel via
Socket.IO.

Elle sert **un seul restaurant**. Aucune table ne porte de colonne de
cloisonnement : une requête n'a jamais besoin d'être « scopée », et l'oubli
d'un filtre de sécurité — principale classe de bugs de l'ancienne architecture
multi-tenant — est devenu impossible par construction.

---

## Démarrer

```bash
cp .env.example .env       # DATABASE_URL et JWT_SECRET sont obligatoires
pnpm install
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm start:dev             # → http://localhost:4000/api/v1
```

Contrôle de santé : `GET /api/v1/health`.

Sur une base vierge, `GET /api/v1/setup/status` répond `{"required": true}` :
c'est ce qui déclenche l'assistant de première installation côté frontend.

---

## Scripts

| Commande | Effet |
|---|---|
| `pnpm start:dev` | API en watch |
| `pnpm build` | Compile vers `dist/` — entrée : **`dist/main.js`** |
| `pnpm start:prod` | `node dist/main` (après `build`) |
| `pnpm test` | Tests unitaires Jest |
| `pnpm test:cov` | Couverture |
| `pnpm lint:ci` | Lint sans correction |
| `pnpm seed-owner` | (Re)crée le compte propriétaire — **dev uniquement** |
| `pnpm seed-test` | Jeu de données pour la suite Playwright |
| `pnpm db:reset` | ⚠️ **Vide la base** et réinstalle un établissement de démo |

> `db:reset` et `seed-owner` exigent `SEED_OWNER_PASSWORD` (et
> `SEED_MANAGER_PASSWORD` pour `db:reset`). En production, le propriétaire est
> créé par l'assistant `/setup`, jamais par un seed.

`tsconfig.build.json` fixe `rootDir: ./src` et exclut `prisma/`. Sans cela,
TypeScript déduirait la racine du paquet et émettrait `dist/src/main.js`, alors
que `start:prod` et le Dockerfile lancent `node dist/main`.

---

## Architecture d'une requête authentifiée

```
AuthMiddleware   JWT → req.user = { id, email }        ← identité seule
      ▼
AuthGuard        SELECT User → rôle et statut à jour   ← 1 requête SQL
      ▼                        rejette si inactif
RolesGuard       user.role ∈ @Roles(...) ?             ← en mémoire
      ▼
Controller       service.method(...)                    ← aucun identifiant
      ▼                                                   d'établissement
Service          prisma.x.findMany({ where: { deletedAt: null } })
```

**Le rôle n'est jamais lu depuis le JWT.** Il est relu en base à chaque
requête. C'est une requête SQL — celle qui remplace les deux que faisait
l'ancienne chaîne (résolution du tenant, puis du membership) — et elle rend la
révocation immédiate : un employé rétrogradé ou désactivé perd ses droits dès
la requête suivante, pas à l'expiration de son jeton.

Le décorateur `@Public()` dispense des deux gardes : carte publique, suivi de
commande, acceptation d'invitation, assistant d'installation.

---

## Modules

| Module | Responsabilité |
|---|---|
| `auth` | Connexion, refresh avec rotation et détection de rejeu, mot de passe oublié |
| `restaurant` | Configuration de l'établissement (identité, service, caisse, impression, horaires, zones de livraison) **et** assistant de première installation |
| `staff` | Équipe, rôles, invitations, transfert de propriété |
| `permissions` | Permissions par rôle et dérogations individuelles |
| `menu`, `categories` | Carte, options et suppléments, carte publique, commande client |
| `orders` | Commandes, machine d'état, écran cuisine |
| `cash-register` | Encaissement, sessions de caisse, réconciliation |
| `inventory` | Ingrédients, recettes, mouvements de stock |
| `tables`, `reservations`, `customers`, `messages` | Salle, réservations, clients, contact |
| `dashboard`, `reports` | Indicateurs et rapports |
| `media`, `blob` | Upload d'images (Vercel Blob), conversion WebP |
| `gateway` | Socket.IO — salon unique du personnel + suivi par commande |
| `mail` | Emails transactionnels (SMTP, dégradation silencieuse si absent) |

---

## Principales routes

Préfixe global : `/api/v1`.

| Préfixe | Accès |
|---|---|
| `/setup`, `/setup/status` | Public — n'aboutit qu'une seule fois |
| `/auth/*` | Public (connexion, refresh, réinitialisation) |
| `/public-menu`, `/restaurant/public`, `/restaurant/opening-hours` | Public |
| `/invites/:token` | Public — accepter une invitation crée le compte |
| `/restaurant`, `/staff`, `/permissions` | Équipe, selon le rôle |
| `/orders`, `/menu`, `/tables`, `/reservations`, `/customers`, `/inventory`, `/cash-register`, `/messages`, `/dashboard`, `/reports`, `/media` | Équipe, selon le rôle |

---

## Base de données

26 modèles Prisma. Points saillants :

**`Restaurant` est un singleton verrouillé par la base :**

```sql
CHECK ("id" = 'restaurant')
```

Créer un second établissement échoue au niveau de PostgreSQL. C'est aussi ce
qui rend `POST /setup` sûr face à deux appels concurrents : le second viole la
clé primaire.

**Contraintes non exprimables en Prisma**, posées en SQL brut dans les
migrations — ne les perdez pas en régénérant le schéma :

| Index | Garantit |
|---|---|
| `Table_number_active_key` | Numéro de table unique, libéré par une suppression logique |
| `Reservation_no_double_booking_key` | Pas de double réservation d'une table sur un créneau |
| `CashRegisterSession_one_open_key` | Une seule session de caisse ouverte à la fois |
| `StaffInvite_one_pending_per_email_key` | Une seule invitation en attente par adresse |
| `User_role_check` | Rôle dans `owner, manager, waiter, chef, cashier` |

**Suppression logique** (`deletedAt`) sur ce qui a une valeur comptable ou
historique : commandes, paiements, réservations, carte, stock. Les clés
étrangères des caissiers sont en `RESTRICT` — un employé ayant encaissé ne peut
pas être effacé, il est désactivé.

Migration depuis la version multi-établissement :
[../docs/MIGRATION_SINGLE_RESTAURANT.md](../docs/MIGRATION_SINGLE_RESTAURANT.md).

---

## Temps réel

Namespace `/ws`. Deux salons seulement :

- **`staff`** — rejoint côté serveur à la poignée de main, après relecture du
  compte en base. Le client n'émet rien : il ne peut pas y entrer de sa propre
  initiative, et aucun oubli de `join` ne peut laisser un poste muet.
- **`order-tracking-{orderId}`** — public. L'UUID reçu dans le lien de suivi
  (122 bits d'entropie) tient lieu d'autorisation.

Événements : `new-order`, `order-status-updated`, `low-stock-alert` (salon
`staff`) ; `status-update` (suivi client).

---

## Variables d'environnement

Obligatoires : `DATABASE_URL`, `JWT_SECRET` (≥ 32 caractères), `FRONTEND_URL`.

Facultatives, chacune avec dégradation propre si absente : `SMTP_*`,
`BLOB_READ_WRITE_TOKEN`, `REDIS_URL`, `SENTRY_DSN`, `MENU_SESSION_SECRET`.

La validation est stricte au démarrage (`src/config/config.validation.ts`) :
une variable manquante ou malformée arrête le processus plutôt que de laisser
tourner un service à moitié configuré.

Sans `REDIS_URL`, la limitation de débit est **en mémoire** — donc par instance
et remise à zéro à chaque redémarrage. Redis est requis en multi-instance.

Inventaire complet et impact des rotations :
[../docs/SECRETS.md](../docs/SECRETS.md).

---

## Tests

```bash
pnpm test        # 26 suites, 207 tests
pnpm test:cov
```

Les tests unitaires n'ont besoin d'aucune base : `src/__tests__/prisma.mock.ts`
fournit un double de `PrismaService`. Ajouter un modèle Prisma implique de
l'ajouter à la liste `PRISMA_MODELS` de ce fichier.

Fabriques de données : `src/test/factories.ts`.
