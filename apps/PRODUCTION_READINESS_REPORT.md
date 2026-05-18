# Flash Menu — Production Readiness Report
**Date :** 2026-05-17  
**Périmètre :** Backend NestJS 11 + Frontend Next.js 16  
**Statut :** Prêt staging, conditionnel production

---

## Résultats de validation finale

```
pnpm build (backend)       → 0 erreur TypeScript
pnpm build (frontend)      → 42 routes, 0 erreur
pnpm test                  → 24 suites / 230 tests PASS (unit)
pnpm test:integration      → 2 suites / 20 tests PASS
pnpm test:cov              → 41.66% global (seuils 30% OK)
```

---

## Coverage détaillée par module

| Module | Statements | Branches | Fonctions | Lignes |
|---|---|---|---|---|
| `auth` (service + onboarding) | 45% | 30% | 35% | 47% |
| `billing` | 50% | 38% | 50% | 55% |
| `categories` | 46% | 41% | 50% | 41% |
| `common/guards` | **80%** | **77%** | 67% | **80%** |
| `common/middleware` | 40% | 59% | 33% | 44% |
| `customers` | 32% | 32% | 17% | 31% |
| `dashboard` | 30% | 25% | 30% | 28% |
| `gateway` | **88%** | **86%** | 50% | **87%** |
| `health` | **100%** | 70% | **100%** | **100%** |
| `inventory` | 39% | 27% | 40% | 37% |
| `menu` | 59% | 49% | 38% | 59% |
| `messages` | 38% | 28% | 42% | 34% |
| `orders` | 39% | 43% | 40% | 37% |
| `permissions` | 43% | 34% | 29% | 40% |
| `plans` | **75%** | **68%** | **77%** | **78%** |
| `reservations` | 44% | 50% | 50% | 38% |
| `settings` | 19% | 15% | 15% | 17% |
| `tables` | 41% | 41% | 36% | 38% |
| `tenants` | 34% | 28% | 43% | 32% |
| **GLOBAL** | **41.66%** | **35.97%** | **33.33%** | **41.28%** |

---

## Modules encore faibles (< 30%)

| Module | Raison | Action recommandée |
|---|---|---|
| `settings` | Service complexe (horaires, zones livraison, links sociaux) non entièrement testé | Créer tests pour `updateOpeningHours`, `findDeliveryZones`, `updateSocialLinks` |
| `mail` | Template HTML, peu de logique testable | Mock transporter OK, les templates sont des strings — bas ROI |
| `reports` | Service d'agrégation complexe | Tester les agrégations Prisma avec mock |
| `cash-register` | Non testé | Suivre le pattern des autres services CRUD |

---

## Hotspots techniques restants

### HIGH — À corriger avant production commerciale

| Hotspot | Impact | Effort |
|---|---|---|
| TenantGuard sans cache (2 requêtes DB/request) | -20ms/req, bottleneck à 500 req/s | M — ajouter Redis TTL 60s |
| Race condition TOCTOU sur plan limits | Possible dépassement quota en cas de spike | M — transaction Serializable |
| Stripe idempotency Map en mémoire (perdue au restart) | Double-charge possible après restart | S — Redis SETNX |
| JWT tokens non révocables (access_token 15min) | Si compromis, actif 15min | M — blacklist Redis ou durée 5min |

### MEDIUM — À traiter en v1.1

| Hotspot | Impact |
|---|---|
| Socket.io sans Redis adapter | Rooms non partagées cross-instances |
| Throttler in-memory | Limites non partagées cross-instances |
| Logs console sans niveau en production | Difficile à filtrer dans Datadog/CloudWatch |
| PrismaService sans retry sur connexion perdue | Crash si DB redémarre |

---

## Bottlenecks potentiels

### Base de données
```
Requêtes critiques/request:
  TenantGuard: +2 queries (tenant + membership)
  PlanLimitService: +2 queries (plan + count)
  Ordre typique staff: 6-8 requêtes total

Estimé DB throughput max:
  PostgreSQL pool=10, ~50ms/query → ~200 req/s sustainable
  Avec cache Redis (tenant + plan): ~800 req/s
```

### WebSocket
```
Rooms en mémoire par instance:
  ~10,000 connexions simultanées
  Limite OS ulimit pour sockets
  Avec Redis adapter: scale horizontal illimité
```

### Prisma
```
Reconnect: automatique avec @prisma/adapter-pg
Pool size: 10 connexions par défaut
Advisory: augmenter à 20 en production
```

---

## Score production-readiness

| Dimension | Score | Justification |
|---|---|---|
| **Sécurité auth** | 88/100 | JWT httpOnly, email verify, RBAC, throttle |
| **SaaS enforcement** | 90/100 | 6 points enforcement, 0 bypass connu |
| **Tests** | 72/100 | 230 tests + 20 intégration, manque e2e |
| **Observabilité** | 65/100 | Structured logging, healthchecks, pas de Prometheus |
| **Infrastructure** | 88/100 | Docker, nginx, CI/CD, migrations |
| **Résilience** | 55/100 | Single-instance safe, pas Redis distribué |
| **Performance** | 60/100 | DB non cachée, N queries/request |
| **Code Quality** | 78/100 | ADRs, refactoring complet, couverture 41% |
| **PRODUCTION READINESS** | **75/100** | Déployable staging, conditionnel production |
| **ENTERPRISE READINESS** | **45/100** | Redis requis, SLA monitoring manquant |

---

## Estimation capacité

### Configuration actuelle (1 instance, no Redis)

| Métrique | Estimé | Condition |
|---|---|---|
| Utilisateurs simultanés | ~300-500 | Sans cache, avec DB pool=10 |
| Restaurants simultanés | ~50-100 actifs | Dépend de l'activité |
| Commandes/minute | ~150-200 | Pic toléré 5 minutes |
| WebSocket connexions | ~5,000-10,000 | Dépend ulimit OS |

### Configuration cible (3 instances, Redis, Postgres pool=20)

| Métrique | Estimé | Condition |
|---|---|---|
| Utilisateurs simultanés | ~2,000-5,000 | Avec cache Redis TenantGuard |
| Restaurants simultanés | ~500-1,000 actifs | |
| Commandes/minute | ~1,000-2,000 | |
| WebSocket connexions | ~30,000+ | Avec Redis adapter |

---

## Risques restants avant production commerciale

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| **DB bottleneck à forte charge** | Haute | Élevé | Cache Redis TenantGuard (P1) |
| **Race condition quotas** | Faible | Moyen | Transaction Serializable (P1) |
| **Redis adapter Socket.io manquant** | Certaine si scale | Élevé | Implémenter avant > 2 instances |
| **Pas de APM/alerting** | N/A | Élevé | Datadog/Sentry avant go-live |
| **Migrations DB non testées sur données réelles** | Possible | Critique | Tester sur dump prod avant migration |
| **Pas de backup DB automatique** | N/A | Critique | Configurer pg_dump cron ou managed backups |
| **Email SMTP non configuré** | Certain en dev | Moyen | Configurer avant test e-mail marketing |

---

## Roadmap finale avant lancement commercial

### Sprint 1 (1 semaine) — Pré-lancement critique

```
[ ] Redis : TenantGuard cache TTL 60s
[ ] Redis : throttler distribué
[ ] Redis : Stripe idempotency SETNX
[ ] Prisma : transactions serialisables sur plan limits
[ ] Sentry : error tracking (frontend + backend)
[ ] Backup PostgreSQL : pg_dump cron ou RDS automated backups
[ ] Tests e2e complets (login → commande → paiement)
```

### Sprint 2 (1 semaine) — Stabilité production

```
[ ] APM : Datadog ou New Relic (latence, saturation, erreurs)
[ ] Prometheus endpoint + Grafana dashboard
[ ] Socket.io Redis adapter (si > 1 instance prévue)
[ ] Tests de charge : k6 ou Artillery (valider 200 req/s)
[ ] Runbook production : procédures incident, rollback, migration
[ ] Documentation API : Swagger/OpenAPI
```

### Sprint 3 (2 semaines) — Qualité tests

```
[ ] Coverage settings.service.ts 70%+
[ ] Coverage reports.service.ts 70%+
[ ] Coverage cash-register.service.ts 70%+
[ ] Tests e2e Playwright : onboarding, commande QR, paiement
[ ] Tests de mutation (Stryker) sur code critique
[ ] Coverage global 60%+
```

---

## Suite de tests complète (état actuel)

| Type | Commande | Résultat |
|---|---|---|
| Unit | `pnpm test` | 24 suites / 230 tests ✓ |
| Coverage | `pnpm test:cov` | 41.66% global ✓ |
| Intégration | `pnpm test:integration` | 2 suites / 20 tests ✓ |
| E2E (mocked) | `pnpm test:e2e` | Infrastructure prête |
| Build backend | `pnpm build` | 0 erreur ✓ |
| Build frontend | `pnpm build` | 42 routes ✓ |

---

*Flash Menu Production Readiness Report — 2026-05-17*
