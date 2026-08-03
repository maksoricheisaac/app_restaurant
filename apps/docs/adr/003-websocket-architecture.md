# ADR-003 — Architecture WebSocket

**Date :** 2026-05-17
**Statut :** Accepté — révisé le 2026-08-02 (voir ADR-007)

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
  // Le compte est relu en base, comme sur les routes HTTP : un employé
  // désactivé ne doit pas continuer à recevoir les commandes en direct.
  const account = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (account?.status === 'active') {
    client.data.user = account;
    await client.join('staff');   // salon unique de l'établissement
  }
}
// Token invalide ou compte inactif → client anonyme (suivi de commande seul)
```

### Rooms et isolation

| Room | Format | Accès |
|---|---|---|
| Personnel | `staff` | Rejointe automatiquement à la connexion par tout compte actif. Il n'y a qu'un établissement : plus rien à cloisonner, donc plus de `join-tenant` dont l'oubli laissait un poste muet. |
| Suivi de commande | `order-tracking-{orderId}` | Public. L'UUID (122 bits d'entropie) tient lieu de secret — l'énumération n'est pas une menace praticable. |

### Événements émis par le backend

| Événement | Room | Déclencheur |
|---|---|---|
| `new-order` | `staff` | Création commande (caisse ou carte publique) |
| `order-status-updated` | `staff` | Changement de statut |
| `low-stock-alert` | `staff` | Ingrédient passé sous son seuil |
| `status-update` | `order-tracking-{id}` | Changement de statut (suivi client) |

### Sécurité des rooms

**Salon `staff`** : rejoint côté serveur à la poignée de main, après relecture
du compte en base. Le client n'émet rien — il ne peut donc pas y entrer de sa
propre initiative.

**join-order** : vérifie seulement que la commande existe. L'UUID reçu dans le
lien de suivi tient lieu d'autorisation.

## Limites actuelles

1. **Single-instance** : les rooms Socket.io sont en mémoire. Pour multi-instance, nécessite Redis adapter (`@nestjs/platform-socket.io` + `socket.io-redis`).
2. **Re-join au reconnect** : le salon `staff` est re-rejoint automatiquement (la poignée de main rejoue) ; seul `join-order` doit être ré-émis par le client, ce que fait le `SocketProvider` sur l'événement `connect`.
3. **GatewayModule est `@Global()`** : `EventsService` est disponible dans toute l'app sans import explicite.
