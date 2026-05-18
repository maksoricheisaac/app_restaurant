# ADR-005 — Stratégie Redis et Scaling

**Date :** 2026-05-17  
**Statut :** Accepté (single-instance implémenté, multi-instance documenté)

---

## Contexte

Flash Menu utilise actuellement :
- `@nestjs/throttler` avec stockage en mémoire (in-process)
- Socket.io sans adapter Redis
- Idempotency Stripe avec Map en mémoire

Ces choix sont valides pour une seule instance. Dès que l'app scale horizontalement (2+ pods), ils créent des divergences.

## Décision

### Throttler distribué (à implémenter à N instances)

```bash
pnpm add @nestjs-throttler-storage-redis ioredis
```

```typescript
// app.module.ts
import { ThrottlerStorageRedisService } from '@nestjs-throttler-storage-redis';

ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    throttlers: [
      { name: 'short', ttl: 60_000, limit: 30 },
      { name: 'long', ttl: 3_600_000, limit: 500 },
    ],
    storage: new ThrottlerStorageRedisService({
      host: config.get('REDIS_HOST', 'localhost'),
      port: config.get('REDIS_PORT', 6379),
      password: config.get('REDIS_PASSWORD'),
    }),
  }),
  inject: [ConfigService],
}),
```

### Socket.io multi-instance (à implémenter à N instances)

```bash
pnpm add @socket.io/redis-adapter ioredis
```

```typescript
// gateway.module.ts ou events.gateway.ts onModuleInit
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);
this.server.adapter(createAdapter(pubClient, subClient));
```

### Idempotency Stripe distribuée (à implémenter à N instances)

```typescript
// billing.service.ts — remplacer Map en mémoire par Redis SETNX
async isEventProcessed(eventId: string): Promise<boolean> {
  const key = `stripe:event:${eventId}`;
  const result = await this.redis.set(key, '1', 'NX', 'EX', 90000); // 25h
  return result === null; // null = déjà existant
}
```

### Variables d'environnement à ajouter pour Redis

```env
REDIS_URL=redis://:password@host:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Limites actuelles

| Composant | Single-instance | Multi-instance |
|---|---|---|
| Throttler | ✓ en mémoire | ✗ à migrer vers Redis |
| WebSocket rooms | ✓ en mémoire | ✗ à migrer vers Redis adapter |
| Stripe idempotency | ✓ Map mémoire (perd au restart) | ✗ à migrer vers Redis SETNX |
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
