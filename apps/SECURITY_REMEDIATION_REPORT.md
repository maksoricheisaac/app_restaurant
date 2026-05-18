# Security Remediation Report — Flash Menu V1
**Date :** 2026-05-17  
**Auteur :** Audit architecte principal (Claude Sonnet 4.6)  
**Périmètre :** Backend NestJS + Frontend Next.js — production readiness P0

---

## Résumé exécutif

Six bloqueurs critiques ont été identifiés et corrigés dans le code source. Aucun pseudo-fix théorique : tous les changements sont directement implémentés dans le code existant.

| Sévérité | ID | Titre | Statut |
|---|---|---|---|
| CRITIQUE | P0.1 | `emailVerified: true` hardcodé — compte activé sans vérification | ✅ Corrigé |
| CRITIQUE | P0.2 | Injection de prix dans `orders.service.ts` | ✅ Corrigé |
| ÉLEVÉE | P0.3 | Absence de throttle sur `/auth/refresh` + pas de resend-verification | ✅ Corrigé |
| ÉLEVÉE | P0.4 | Isolation tenant manquante dans `join-order` WebSocket | ✅ Corrigé |
| ÉLEVÉE | P0.5 | Upload : validation magic bytes absente | ✅ Corrigé |
| MOYENNE | P0.6 | Fichiers `.env.example` manquants | ✅ Corrigé |

---

## Analyse état initial (avant correction)

### Ce qui était déjà correct

| Domaine | Statut |
|---|---|
| `.env` dans `.gitignore` backend | ✅ présent |
| `.env*` dans `.gitignore` frontend | ✅ présent |
| Cookies `httpOnly: true` sur access_token + refreshToken | ✅ présent |
| `secure: true` en production (basé sur `NODE_ENV`) | ✅ présent |
| Throttle login : `5 req/min, 20/h` | ✅ présent |
| Throttle forgot-password : `3 req/min, 10/h` | ✅ présent |
| Helmet + HSTS + CSP configurés dans `main.ts` | ✅ présent |
| CORS production : origins restreints | ✅ présent |
| TenantGuard : vérification membership sur toutes routes privées | ✅ présent |
| WebSocket `join-tenant` : vérification membership DB | ✅ présent |
| Prix re-fetchés depuis DB dans `public-menu.controller.ts` | ✅ présent |
| Refresh token : stockage par hash SHA-256 | ✅ présent |
| `forgotPassword` : réponse identique user existant/inexistant (anti-énumération) | ✅ présent |
| JWT_SECRET chargé via ConfigService (pas hardcodé dans le code) | ✅ présent |
| Validation DTO globale `whitelist + forbidNonWhitelisted` | ✅ présent |

---

## Détail des corrections

---

### P0.1 — `emailVerified: true` hardcodé — CRITIQUE

**Fichier :** `backend/src/auth/onboarding.service.ts`  
**Ligne originale :** 91  
**Impact :** Tout utilisateur créait un compte immédiatement vérifié. La vérification email dans `auth.service.ts:login()` était complètement contournée à la registration. N'importe qui pouvait créer des comptes sans contrôler l'email.

**Correction appliquée :**

```typescript
// AVANT (vulnérable)
emailVerified: true,

// APRÈS (corrigé)
emailVerified: false,
emailVerificationToken: verificationToken,   // crypto.randomBytes(32).toString('hex')
emailVerificationExpiry: verificationExpiry, // now + 24h
```

- `emailVerified` est maintenant `false` à la création.
- Un token de vérification 32 bytes (256 bits) est généré via `crypto.randomBytes`.
- L'expiry est positionnée à now+24h.
- `mailService.sendEmailVerification()` est appelé immédiatement.
- Les tokens JWT d'onboarding sont toujours émis pour permettre les étapes suivantes (step/account-type, step/restaurant-info, etc.) — le flow onboarding fonctionne, mais le **login classique** reste bloqué tant que l'email n'est pas vérifié (`auth.service.ts:login()` vérifie `user.emailVerified`).

**Impact potentiel :** Les utilisateurs existants créés avec `emailVerified: true` ne sont pas affectés. Les nouveaux comptes doivent vérifier leur email. Si SMTP n'est pas configuré, le lien est loggué en DEV via `logger.warn` (comportement déjà présent dans `mail.service.ts`).

---

### P0.2 — Injection de prix dans `orders.service.ts` — CRITIQUE

**Fichier :** `backend/src/orders/orders.service.ts`  
**Impact :** Les prix dans `POST /orders` (endpoint staff POS) venaient directement du client. Un serveur ou caissier mal intentionné pouvait créer une commande de 10 plats à 0.01 FCFA chacun.

**Correction appliquée :**

```typescript
// Re-fetch authoritative prices from DB for all items with a menuItemId.
const menuItemIds = items.filter(i => i.menuItemId).map(i => i.menuItemId!);
const dbMenuItems = await this.prisma.menuItem.findMany({
  where: { id: { in: menuItemIds }, tenantId, deletedAt: null },
  select: { id: true, name: true, price: true, image: true },
});

// Tenant isolation: all menuItemIds must exist in THIS tenant.
for (const item of items) {
  if (item.menuItemId && !priceMap.has(item.menuItemId)) {
    throw new BadRequestException(`Article inconnu ou indisponible: ${item.menuItemId}`);
  }
}

// Use DB price when menuItemId is known; staff-supplied price only for custom items (no menuItemId).
price: db ? Number(db.price) : item.price,
```

**Cas bord documenté :** Les items sans `menuItemId` (article personnalisé dans le POS) conservent le prix fourni par le staff. Ce cas est légitime dans un POS restaurant mais reste réservé aux utilisateurs authentifiés avec rôle `owner/manager/waiter/cashier`. La **vérification de tenant isolation** (`tenantId` dans la requête DB) empêche qu'un article d'un autre restaurant soit référencé.

---

### P0.3 — Throttle manquant sur `/auth/refresh` + resend-verification absent — ÉLEVÉE

**Fichier :** `backend/src/auth/auth.controller.ts`, `backend/src/auth/auth.service.ts`

**Problème 1 : throttle sur refresh**  
Le endpoint `POST /auth/refresh` n'avait que le throttle global (30 req/min, 500/h). Une attaque par force brute sur les refresh tokens était possible.

```typescript
// AJOUTÉ sur la route refresh
@Throttle({ short: { limit: 10, ttl: 60_000 }, long: { limit: 50, ttl: 60_000 * 60 } })
```

**Problème 2 : resend-verification absent**  
Sans endpoint de renvoi, un utilisateur dont l'email de vérification a expiré (>24h) était bloqué définitivement. Cela crée aussi une pression à contourner la vérification.

```typescript
// AJOUTÉ dans auth.service.ts
async resendVerificationEmail(email: string): Promise<{ message: string }>

// AJOUTÉ dans auth.controller.ts
@Public()
@Throttle({ short: { limit: 3, ttl: 60_000 }, long: { limit: 10, ttl: 60_000 * 60 } })
@Post('resend-verification')
resendVerification(@Body() body: { email?: string })
```

La réponse est **identique** que l'email existe ou non (anti-énumération), même pattern que `forgotPassword`.

---

### P0.4 — WebSocket `join-order` : isolation tenant — ÉLEVÉE

**Fichier :** `backend/src/gateway/events.gateway.ts`

**Problème :** Un utilisateur staff authentifié connaissant un `orderId` d'un autre restaurant pouvait s'abonner aux mises à jour de cette commande en temps réel (fuite d'information cross-tenant).

**Correction appliquée :**

```typescript
// Récupération du tenantId de la commande depuis DB
const order = await this.prisma.order.findUnique({
  where: { id: orderId },
  select: { id: true, tenantId: true },  // tenantId ajouté
});

// Si authentifié : vérification que la commande appartient au tenant de l'utilisateur
if (user?.id) {
  if (user.tenantId && user.tenantId !== order.tenantId) {
    return { status: 'error', message: 'Forbidden' };
  }
  if (!user.tenantId) {
    const membership = await this.prisma.tenantMembership.findFirst({ ... });
    if (!membership) return { status: 'error', message: 'Forbidden' };
  }
}
// Non authentifié : autorisé (clients publics qui trackent leur commande via lien UUID)
```

**Justification du cas public :** Les `orderId` sont des UUIDs v4 (122 bits d'entropie). L'énumération n'est pas une menace pratique. Le tracking public est un use case légitime (le client reçoit l'UUID via la page de confirmation).

---

### P0.5 — Upload : validation magic bytes absente — ÉLEVÉE

**Fichier :** `frontend/app/api/upload/route.ts`

**Problème :** Seul le header `Content-Type` était vérifié, qui est entièrement contrôlé par le client. Un attaquant pouvait renommer un fichier `.php` ou `.exe` en `.jpg` et l'uploader.

**Correction appliquée :**

```typescript
// Signatures binaires des formats autorisés
const MAGIC_SIGNATURES = {
  'image/jpeg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  'image/png':  [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  'image/gif':  [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, ...] }],
  'image/webp': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // WEBP
  ],
};

// Body entier bufférisé (max 5 MB) avant upload
const fileBuffer = await request.arrayBuffer();
const header = new Uint8Array(fileBuffer.slice(0, 16));
if (!matchesMagicBytes(header, mimeType)) {
  return NextResponse.json({ error: 'Contenu du fichier invalide ...' }, { status: 400 });
}
```

**Amélioration secondaire :** La vérification `content-length` du header était contournable (le header peut mentir). Le corps est maintenant intégralement lu via `arrayBuffer()` avant upload — la taille réelle est vérifiée, pas la taille déclarée.

---

### P0.6 — Fichiers `.env.example` manquants — MOYENNE

**Fichiers créés :**
- `backend/.env.example`
- `frontend/.env.example`

Chaque variable est documentée avec son rôle et une instruction de génération pour `JWT_SECRET`. Les valeurs placeholder sont explicites (`REPLACE_WITH_...`).

---

## État de sécurité post-correction

### Domaines validés (OK en production)

| Domaine | Analyse |
|---|---|
| **Secrets** | `.env` dans `.gitignore` ✅. JWT_SECRET via ConfigService ✅. Aucun secret hardcodé dans le code source. |
| **Cookies** | `httpOnly: true`, `secure: true` en production, `sameSite: lax` ✅. Pas de token dans localStorage. |
| **Auth flow** | Login bloque si `emailVerified: false` ✅. Refresh token hashé SHA-256 ✅. Rotation au refresh ✅. Max 5 tokens/user ✅. |
| **Email vérification** | Token 256 bits, expiry 24h, envoi email immédiat, resend disponible ✅. |
| **Throttle** | Login `5/min`, forgot-password `3/min`, refresh `10/min`, resend-verification `3/min`, register `5/min` ✅. |
| **Prix commandes** | Public orders : DB price depuis le début ✅. Staff orders : DB price pour menuItems connus ✅. |
| **Isolation tenant** | TenantGuard vérifie membership ✅. WebSocket join-tenant vérifie membership ✅. WebSocket join-order vérifie tenant ✅. |
| **Upload** | Allowlist MIME ✅. Magic bytes validation ✅. Filename sanitization ✅. Auth requise ✅. |
| **Helmet** | CSP, HSTS (1an + preload), referrer-policy ✅. |
| **CORS** | Origins restreints en production ✅. |

---

## TODO résiduel (hors P0, non bloquant production)

| Priorité | Item | Justification |
|---|---|---|
| P1 | **Rotation JWT_SECRET** : documenter la procédure (changer la valeur + redémarrer) | Le secret actuel dans `.env` doit être considéré comme potentiellement exposé si le fichier a jamais été versionné dans un commit antérieur |
| P1 | **Resend-verification : DTO avec `@IsEmail()`** | Le endpoint valide l'email via guard mais sans class-validator — faible risque vu le throttle |
| P1 | **Vérifier historique git** : `git log --all --full-history -- .env` pour confirmer que `.env` n'a jamais été committé | Priorité absolue si ce projet a un remote |
| P2 | **Email vérification dans l'onboarding flow** : si un utilisateur se déconnecte avant de vérifier son email, il ne peut plus se reconnecter via login. Envisager un UX dédié (banner "vérifiez votre email") | |
| P2 | **CSP** : ajouter `upgrade-insecure-requests` en production | |
| P2 | **Helmet frame-ancestors** : restreindre à `'none'` explicitement dans les directives CSP (actuellement `frameSrc: "'none'"`) | Déjà configuré, vérifier impact Next.js |
| P3 | **Audit log** : `audit.middleware.ts` est présent — vérifier qu'il persiste en DB et non seulement en log console | |
| P3 | **Rate limiting par IP** : le throttle actuel est global. Envisager `@nestjs/throttler` avec un storage Redis pour les déploiements multi-instance | |

---

## Fichiers modifiés

| Fichier | Type | Changement |
|---|---|---|
| `backend/src/auth/onboarding.service.ts` | Backend | `emailVerified: false` + génération token + envoi email |
| `backend/src/orders/orders.service.ts` | Backend | Re-fetch prix DB + isolation tenant + `BadRequestException` import |
| `backend/src/auth/auth.service.ts` | Backend | Ajout `resendVerificationEmail()` |
| `backend/src/auth/auth.controller.ts` | Backend | Throttle sur `refresh` + endpoint `POST /auth/resend-verification` + `BadRequestException` import |
| `backend/src/gateway/events.gateway.ts` | Backend | Isolation tenant dans `handleJoinOrder` |
| `frontend/app/api/upload/route.ts` | Frontend | Magic bytes validation + buffering complet du body |
| `backend/.env.example` | Config | Créé — documentation des variables |
| `frontend/.env.example` | Config | Créé — documentation des variables |

---

*Flash Menu Security Remediation Report — généré le 2026-05-17*
