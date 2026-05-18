# ADR-002 — Isolation multi-tenant

**Date :** 2026-05-17  
**Statut :** Accepté

---

## Contexte

Flash Menu est un SaaS B2B : plusieurs restaurants (tenants) partagent la même infrastructure. L'isolation des données est critique — un bug permettant à un restaurant de voir ou modifier les données d'un autre serait catastrophique.

## Décision

### Modèle d'isolation : Row-Level Isolation (RLS applicatif)

Toutes les tables métier ont un champ `tenantId`. Toutes les requêtes Prisma incluent `tenantId` dans le WHERE.

**Il n'y a pas d'isolation PostgreSQL (Row Level Security)** — l'isolation est entièrement applicative via le `TenantGuard`.

### Résolution du tenant

Le tenant est résolu via les headers HTTP :
1. `x-tenant-id` — ID direct du tenant (priorité 1)
2. `x-tenant-slug` — slug du tenant, résolu en ID (priorité 2)

Ces headers sont fournis par :
- **Frontend client** : depuis `localStorage.getItem('tenantId')` dans `api-client.ts`
- **SSR (layouts)** : depuis les cookies httpOnly `tenantId` / `tenantSlug` via le proxy middleware Next.js (`proxy.ts`)

### TenantGuard

```typescript
// Sur chaque requête protégée :
1. Lecture x-tenant-id ou x-tenant-slug depuis les headers
2. Lookup DB : prisma.tenant.findFirst({ where: { id | slug } })
3. Lookup DB : prisma.tenantMembership.findUnique({ where: { userId_tenantId } })
4. Si membership trouvé → request.tenant = tenant, request.membership = membership
5. Sinon → 403 Forbidden
```

**Exception :** `super_admin` bypasse le TenantGuard (accès à tous les tenants).  
**Exception :** routes `@Public()` bypasse le TenantGuard.

### Garanties d'isolation

| Surface | Mécanisme |
|---|---|
| HTTP REST | `TenantGuard` vérifie le membership avant chaque handler |
| Prisma queries | Toutes incluent `where: { tenantId }` |
| WebSocket join-tenant | Vérification membership en DB avant d'ajouter au room |
| WebSocket join-order | Vérification tenant de la commande si utilisateur authentifié |
| Plan limits | `PlanLimitService` filtre par `tenantId` |

### Points de vigilance

1. **Pas de RLS PostgreSQL** : si un bug dans le code oublie `tenantId` dans un WHERE, la fuite est possible. Mitigation : code review systématique + tests d'isolation.
2. **localStorage côté client** : `tenantId` est aussi dans localStorage pour les API calls client-side. Peut être modifié par l'utilisateur, mais le `TenantGuard` vérifie le membership → modification sans effet.
3. **super_admin** : n'est jamais assigné à un tenant dans TenantMembership → bypass spécifique dans RolesGuard.

## Conséquences

**Positives :**
- Simple à comprendre et à auditer
- Pas de configuration DB complexe

**Négatives :**
- Performance : 2 requêtes DB par requête authentifiée (tenant + membership) — pas de cache Redis actuellement
- Risque d'oubli d'un `tenantId` filter → à surveiller en code review
