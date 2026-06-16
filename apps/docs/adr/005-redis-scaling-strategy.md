# ADR-005 — Stratégie Redis et Scaling

**Date :** 2026-05-17 (mis à jour le 2026-06-15)  
**Statut :** Accepté — implémenté (throttler, Socket.io adapter et idempotence webhooks basculent automatiquement sur Redis quand `REDIS_URL` est défini, sinon fallback in-memory single-instance)

---

## Contexte

Flash Menu utilise actuellement :
- `@nestjs/throttler` avec stockage en mémoire (in-process)
- Socket.io sans adapter Redis
- Idempotency Stripe avec Map en mémoire

Ces choix sont valides pour une seule instance. Dès que l'app scale horizontalement (2+ pods), ils créent des divergences.

## Décision

### Throttler distribué — IMPLÉMENTÉ

```bash
pnpm add @nest-lab/throttler-storage-redis ioredis
```

Voir `apps/backend/src/app.module.ts` : `ThrottlerModule.forRootAsync` instancie
`ThrottlerStorageRedisService(redisUrl)` quand `REDIS_URL` est défini (et que
`ioredis` est disponible), sinon utilise le stockage in-memory par défaut.

### Socket.io multi-instance — IMPLÉMENTÉ

```bash
pnpm add @socket.io/redis-adapter ioredis
```

Voir `apps/backend/src/gateway/redis-io.adapter.ts` (`RedisIoAdapter`), branché
dans `apps/backend/src/main.ts` via `app.useWebSocketAdapter(...)` :

```typescript
const redisIoAdapter = new RedisIoAdapter(app, configService.get('REDIS_URL'));
redisIoAdapter.connectToRedis();
app.useWebSocketAdapter(redisIoAdapter);
```

Quand `REDIS_URL` est absent ou que la connexion échoue, l'adapter logue un
avertissement et conserve l'adapter in-memory par défaut (rooms/broadcasts
limités à l'instance courante).

### Idempotency webhooks distribuée — IMPLÉMENTÉ

Voir `apps/backend/src/common/redis/idempotency.service.ts`
(`IdempotencyService`), utilisé par `BillingService.handleWebhook` :

```typescript
const isNewEvent = await this.idempotency.checkAndMark(
  `billing:webhook:${provider.name}:${event.eventId}`,
  PROCESSED_EVENT_TTL_SECONDS, // 25h
);
if (!isNewEvent) return; // duplicate delivery — already processed
```

`IdempotencyService` utilise `SET key 1 EX <ttl> NX` via le client Redis
partagé (`RedisService`, `apps/backend/src/common/redis/redis.service.ts`)
quand `REDIS_URL` est défini ; sinon (ou en cas d'erreur Redis), bascule sur un
`Map` en mémoire avec éviction par TTL (comportement single-instance d'origine).

### Variables d'environnement pour Redis

```env
REDIS_URL=redis://:password@host:6379
REDIS_PASSWORD=
```

## État actuel

| Composant | Sans `REDIS_URL` | Avec `REDIS_URL` |
|---|---|---|
| Throttler | ✓ en mémoire (single-instance) | ✓ Redis (multi-instance) |
| WebSocket rooms (Socket.io) | ✓ en mémoire (single-instance) | ✓ Redis adapter (multi-instance) |
| Idempotence webhooks paiement | ✓ Map mémoire (perd au restart) | ✓ Redis SETNX+EX (multi-instance) |
| Sessions | Stateless (JWT) | ✓ OK |
| DB connections | 1 pool par instance | ✓ OK (Prisma pool per instance) |

## Capacité estimée single-instance

- **RAM utilisée** : ~150-200MB Node.js + 64MB Socket.io rooms en mémoire
- **Requests/sec** : ~500-1000 req/s avec Prisma pool size 10
- **Concurrent WebSocket** : ~10,000 connexions par instance
- **Bottleneck** : PostgreSQL write throughput (~1000 TPS)

## Capacité estimée avec Redis + 3 instances

- **Requests/sec** : ~2000-3000 req/s (3× scale)
- **WebSocket** : ~30,000 connexions
- **Throttle** : distribué, cohérent cross-instances
