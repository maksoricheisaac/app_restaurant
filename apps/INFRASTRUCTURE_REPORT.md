# Flash Menu — Production Infrastructure Report
**Date :** 2026-05-17  
**Périmètre :** Industrialisation complète — Docker, CI/CD, Observabilité, Prisma, Nginx  
**Stack :** NestJS 11 + Next.js 16 + PostgreSQL 16 + Redis 7 + Nginx 1.27

---

## Arborescence finale

```
apps/
├── .github/
│   └── workflows/
│       └── ci.yml                      ← Pipeline CI/CD GitHub Actions
├── backend/
│   ├── Dockerfile                      ← Multi-stage, non-root user, healthcheck
│   ├── .dockerignore
│   ├── .env.example                    ← Template variables (déjà créé phase P0)
│   ├── prisma/
│   │   └── schema.prisma               ← Enums DB ajoutés (TenantPlan, TenantStatus...)
│   └── src/
│       ├── config/
│       │   └── config.validation.ts    ← Validation Zod fail-fast au démarrage
│       ├── health/
│       │   ├── health.controller.ts    ← GET /health /live /ready
│       │   └── health.module.ts
│       ├── common/
│       │   ├── filters/
│       │   │   └── global-exception.filter.ts  ← requestId + JSON structuré
│       │   └── middleware/
│       │       └── request-id.middleware.ts     ← X-Request-ID propagation
│       ├── app.module.ts               ← HealthModule + validateConfig + RequestIdMiddleware
│       └── main.ts                     ← enableShutdownHooks + 0.0.0.0 bind + JSON logger
├── frontend/
│   ├── Dockerfile                      ← Multi-stage standalone Next.js, non-root
│   ├── .dockerignore
│   ├── .env.example
│   └── next.config.ts                  ← output: 'standalone' ajouté
├── nginx/
│   ├── nginx.conf                      ← Config globale (gzip, rate limiting, log JSON)
│   ├── certs/                          ← Montage TLS (fullchain.pem + privkey.pem)
│   └── conf.d/
│       ├── app.conf                    ← vhost HTTPS, WS, reverse proxy, security headers
│       └── proxy_params.inc            ← Shared proxy headers
├── scripts/
│   ├── migrate-prod.sh                 ← Migration production-safe (prisma migrate deploy)
│   ├── seed-dev.sh                     ← Seed dev uniquement
│   └── reset-dev.sh                    ← Reset complet dev (destructif)
├── docker-compose.yml                  ← Stack complète (postgres, redis, backend, frontend, nginx)
├── docker-compose.dev.yml              ← Overrides développement
├── SECURITY_REMEDIATION_REPORT.md
└── INFRASTRUCTURE_REPORT.md           ← Ce fichier
```

---

## Commandes exactes

### Lancement local (développement)

```bash
# 1. Copier les env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Remplir les valeurs dans les deux fichiers

# 2. Installer les dépendances
cd backend && pnpm install && cd ..
cd frontend && pnpm install && cd ..

# 3. Générer le client Prisma et lancer la première migration dev
cd backend
pnpm exec prisma migrate dev --name init
pnpm exec prisma generate

# 4. Seeder le compte admin
pnpm run seed-admin

# 5. Lancer backend (port 3000)
pnpm start:dev

# 6. Lancer frontend dans un autre terminal (port 4000)
cd ../frontend && pnpm dev
```

### Lancement Docker (stack complète)

```bash
# 1. Créer les fichiers env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Ajouter les variables Docker au fichier .env (à la racine apps/) :
cat >> .env << 'EOF'
POSTGRES_USER=flash_menu_user
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE
REDIS_PASSWORD=STRONG_REDIS_PASSWORD_HERE
NEXT_PUBLIC_API_URL=https://yourdomain.com/api/v1
NEXT_PUBLIC_APP_URL=https://yourdomain.com
EOF

# 3. Build + démarrage
docker compose up -d --build

# 4. Vérifier l'état des services
docker compose ps
docker compose logs -f backend

# 5. Vérifier les health checks
curl http://localhost/api/v1/health
curl http://localhost/api/v1/health/live
curl http://localhost/api/v1/health/ready
```

### Commandes Docker utiles

```bash
# Voir les logs d'un service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx

# Accéder au shell du backend
docker compose exec backend sh

# Accéder à psql
docker compose exec postgres psql -U flash_menu_user -d flash_menu_db

# Relancer uniquement le backend après un changement
docker compose up -d --build --no-deps backend

# Arrêt propre (graceful shutdown respecté)
docker compose down

# Suppression complète avec volumes (DESTRUCTIF)
docker compose down -v
```

---

## Procédure de déploiement VPS Linux

### Prérequis

```bash
# Ubuntu 22.04+ / Debian 12+
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git curl

# Ajouter l'utilisateur au groupe docker (évite sudo)
sudo usermod -aG docker $USER && newgrp docker
```

### Premier déploiement

```bash
# 1. Cloner le repo
git clone https://github.com/votre-org/flash-menu.git /opt/flashmenu
cd /opt/flashmenu/apps

# 2. Configurer les environnements
cp backend/.env.example backend/.env
nano backend/.env   # Remplir DATABASE_URL, JWT_SECRET, SMTP_*, STRIPE_*

cp frontend/.env.example frontend/.env.local
nano frontend/.env.local

# 3. TLS — Let's Encrypt via certbot (optionnel, requis pour HTTPS)
sudo apt install -y certbot
sudo certbot certonly --standalone -d yourdomain.com
sudo ln -sf /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/certs/fullchain.pem
sudo ln -sf /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/certs/privkey.pem

# 4. Build et démarrage
docker compose up -d --build

# 5. Vérifier
docker compose ps
curl https://yourdomain.com/api/v1/health
```

### Déploiement de mise à jour

```bash
cd /opt/flashmenu/apps

# 1. Pull du code
git pull origin main

# 2. Rebuild + redémarrage sans downtime (rolling)
docker compose up -d --build --no-deps backend frontend

# 3. Les migrations sont appliquées automatiquement au démarrage backend
#    (command: sh -c "prisma migrate deploy && node dist/main")

# 4. Vérifier
docker compose ps
curl https://yourdomain.com/api/v1/health
```

---

## Procédure de rollback

```bash
# Rollback vers l'image précédente (si utilisation GHCR)
docker compose stop backend frontend
docker compose rm -f backend frontend

# Changer le tag dans docker-compose.yml vers le SHA précédent
# image: ghcr.io/votre-org/backend:SHA_PRECEDENT

docker compose up -d backend frontend

# OU rollback via git + rebuild
git checkout HEAD~1 -- backend/ frontend/
docker compose up -d --build --no-deps backend frontend
```

---

## Détail des implémentations

### Phase 1 — Dockerfiles multi-stage

**Backend** (`backend/Dockerfile`) :
- Stage 1 `deps` : installation pnpm via corepack, `pnpm install --frozen-lockfile`
- Stage 2 `build` : `prisma generate` (Linux target), `pnpm build`, `pnpm prune --prod`
- Stage 3 `runner` : image minimale, user non-root `nestjs:1001`, expose 3000
- `HEALTHCHECK` natif Docker via `wget` sur `/api/v1/health`

**Frontend** (`frontend/Dockerfile`) :
- Stage 1/2 identiques avec `NEXT_PUBLIC_*` passés en `ARG` au build
- Stage 3 `runner` : utilise `output: 'standalone'` — seul `server.js` + `.next/static` + `public/`
- Image finale ≈ 200MB vs ≈ 1.5GB sans standalone

### Phase 2 — docker-compose.yml

Topologie réseau isolée :
- `db-net` : postgres ↔ backend uniquement
- `backend-net` : backend ↔ frontend ↔ redis ↔ nginx
- `frontend-net` : frontend ↔ nginx

Ordre de démarrage avec `condition: service_healthy` :
`postgres` → `redis` → `backend` → `frontend` → `nginx`

Le backend exécute `prisma migrate deploy` au démarrage via `command`. La migration est idempotente (ne réapplique pas les migrations déjà appliquées).

### Phase 3 — Nginx

- Rate limiting par zone IP : `api_auth` 10 req/min, `api_order` 20 req/min, `api_general` 60 req/min
- WebSocket : `Upgrade` + `Connection: upgrade` + `proxy_read_timeout 3600s`
- Gzip activé sur JSON, CSS, JS
- Security headers : HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- Logs JSON structurés avec `request_time` et `upstream_response_time`
- Static assets Next.js : `Cache-Control: immutable, max-age=31536000`

### Phase 4 — Prisma schema enums

Champs convertis de `String` vers enums Prisma :

| Modèle | Champ | Avant | Après |
|---|---|---|---|
| `Tenant` | `plan` | `String @default("free")` | `TenantPlan @default(free)` |
| `Tenant` | `status` | `String @default("active")` | `TenantStatus @default(active)` |
| `User` | `status` | `String @default("active")` | `UserStatus @default(active)` |
| `User` | `platformRole` | `String @default("user")` | `PlatformRole @default(user)` |

**Impact migration :** La première `prisma migrate dev` génère une migration qui convertit les colonnes PostgreSQL en types `enum`. Les valeurs existantes doivent correspondre aux enum values — le script `reset-dev.sh` repart de zéro en dev. En production, appliquer avec `prisma migrate deploy` après avoir vérifié les données.

**Scripts migration :**
- `scripts/migrate-prod.sh` : production-safe, utilise `prisma migrate deploy`, refuse localhost sans confirmation
- `scripts/seed-dev.sh` : seed admin, refuse `NODE_ENV=production`
- `scripts/reset-dev.sh` : reset + seed, refuse production + confirmation interactive

### Phase 5 — Health endpoints

| Endpoint | Usage | Vérifie |
|---|---|---|
| `GET /api/v1/health/live` | Kubernetes liveness | Process alive (200 toujours) |
| `GET /api/v1/health/ready` | Kubernetes readiness | DB ping réel |
| `GET /api/v1/health` | Docker, load balancer, monitoring | DB latence, mémoire heap, PID, version Node |

Tous les endpoints sont `@Public()` + `@SkipThrottle()` — pas d'authentification, pas de rate limiting.

### Phase 6 — Config validation Zod (fail-fast)

`backend/src/config/config.validation.ts` — appelé par `ConfigModule.forRoot({ validate })`.

Si une variable requise manque au démarrage :
```
[CONFIG ERROR] Missing or invalid environment variables:
  - DATABASE_URL: DATABASE_URL is required
  - JWT_SECRET: JWT_SECRET must be at least 32 characters
```
Le processus s'arrête avec `process.exit(1)` avant que NestJS ne charge un seul module — pas de service partiellement démarré.

### Phase 7 — GitHub Actions CI/CD

4 jobs dans `.github/workflows/ci.yml` :

| Job | Trigger | Ce qu'il fait |
|---|---|---|
| `backend` | Push + PR | install → prisma generate → lint → typecheck → build |
| `frontend` | Push + PR | install → lint → typecheck → build |
| `docker` | Push main/develop | docker build backend + frontend (no push, cache GHA) |
| `publish` | Push main + env `production` | Build + push vers GHCR avec tags `SHA` + `latest` |

Cache pnpm via `cache: pnpm` + `cache-dependency-path`. Cache Docker via `type=gha`.

### Phase 8 — Observabilité

**RequestIdMiddleware** (`common/middleware/request-id.middleware.ts`) :
- Génère `UUID v4` si pas de `X-Request-ID` entrant (nginx peut en passer un)
- Attache à `req.requestId` + header `X-Request-ID` en réponse
- Propagé dans les logs d'erreur du `GlobalExceptionFilter`

**GlobalExceptionFilter amélioré** :
- Log JSON structuré pour les erreurs non-HTTP : `event`, `requestId`, `method`, `path`, `userId`, `tenantId`, `error`
- `requestId` inclus dans toutes les réponses d'erreur → corrélation frontend/backend

**NestJS Logger** :
- Production : niveaux `error, warn, log` uniquement
- Développement : tous les niveaux

**Graceful shutdown** (`main.ts`) :
- `app.enableShutdownHooks()` → NestJS écoute SIGTERM/SIGINT
- `OnModuleDestroy` dans PrismaService déjà implémenté (`this.$disconnect()`)
- Docker `stop` → SIGTERM → NestJS termine les requêtes en cours → `prisma.$disconnect()` → exit 0

---

## Redis — Architecture cible

Redis est dans le `docker-compose.yml` et le `.env.example`. La configuration NestJS pour l'utiliser :

**Throttler distribué (multi-instance)** — à implémenter quand Redis est disponible :
```bash
# backend
pnpm add @nestjs-throttler-storage-redis ioredis
```
```typescript
// app.module.ts
import { ThrottlerStorageRedisService } from '@nestjs-throttler-storage-redis';
ThrottlerModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    throttlers: [...],
    storage: new ThrottlerStorageRedisService(config.get('REDIS_URL')),
  }),
  inject: [ConfigService],
})
```

**Cache** — à implémenter avec `@nestjs/cache-manager` + `cache-manager-ioredis`.

Actuellement : throttler in-memory (suffisant pour un seul backend pod). Passer à Redis quand horizontal scaling nécessaire.

---

## Risques résiduels

| Risque | Niveau | Mitigation |
|---|---|---|
| Première migration prod sur données réelles avec enums | ÉLEVÉ | Tester sur dump de prod avant. Vérifier que toutes les valeurs existantes matchent les enum values. |
| TLS certs non présents → nginx refuse de démarrer | MOYEN | Utiliser une config HTTP-only pour le premier démarrage, puis activer HTTPS. |
| `pnpm-lock.yaml` absent → `--frozen-lockfile` échoue | MOYEN | Committer le lockfile. Sinon remplacer par `--no-frozen-lockfile` temporairement. |
| Standalone Next.js + `turbopack: {}` — incompatibilité possible | FAIBLE | Turbopack est pour `pnpm dev` uniquement. Le build de prod utilise webpack. |
| Redis password en variable d'environnement dans compose | FAIBLE | Utiliser Docker Secrets en production Swarm/K8s. |

---

*Flash Menu Production Infrastructure Report — généré le 2026-05-17*
