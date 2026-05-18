# ADR-003 — Architecture WebSocket

**Date :** 2026-05-17  
**Statut :** Accepté

---

## Contexte

Flash Menu nécessite des mises à jour temps réel pour :
- Nouvelles commandes (KDS, dashboard)
- Mise à jour statut commande (tracking client)
- Alertes réservations

## Décision

### Socket.io avec namespace `/ws`

Un seul namespace `/ws` avec un système de rooms.

### Authentification WebSocket

```typescript
// handleConnection() — exécuté à chaque connexion
token = handshake.headers.authorization?.split(' ')[1] 
     ?? handshake.auth.token  // jamais depuis query params (loggés par les serveurs)

if (token) {
  decoded = jwtService.verify(token);
  client.data.user = { id, email, role, tenantId };
}
// Token invalide → client reste non-authentifié (rooms publiques seulement)
```

### Rooms et isolation

| Room | Format | Accès |
|---|---|---|
| Tenant room | `tenant-{tenantId}` | Staff authentifié avec membership vérifié en DB |
| Order tracking | `order-tracking-{orderId}` | Authentifié : vérif tenant. Non-authentifié : autorisé (UUID = 122 bits d'entropie) |

### Événements émis par le backend

| Événement | Room | Déclencheur |
|---|---|---|
| `new-order` | `tenant-{id}` | Création commande (staff ou public) |
| `order-status-updated` | `tenant-{id}` | Changement de statut |
| `status-update` | `order-tracking-{id}` | Changement de statut (tracking client) |

### Sécurité des rooms

**join-tenant** : vérifie `TenantMembership` en DB avant d'autoriser.  
**join-order** : vérifie que la commande appartient au tenant de l'utilisateur authentifié. Non-authentifié autorisé (tracking public via UUID).

## Limites actuelles

1. **Single-instance** : les rooms Socket.io sont en mémoire. Pour multi-instance, nécessite Redis adapter (`@nestjs/platform-socket.io` + `socket.io-redis`).
2. **Pas de reconnect room re-join** : si le client se déconnecte, il doit rejoindre à nouveau les rooms.
3. **GatewayModule est `@Global()`** : `EventsService` est disponible dans toute l'app sans import explicite.
