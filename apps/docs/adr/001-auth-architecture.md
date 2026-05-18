# ADR-001 — Architecture d'authentification

**Date :** 2026-05-17  
**Statut :** Accepté

---

## Contexte

Flash Menu est un SaaS multi-tenant. L'authentification doit gérer :
1. La connexion locale (email + mot de passe)
2. La vérification de JWT sur chaque requête
3. Le refresh silencieux des tokens expirés
4. Le flow d'onboarding multi-étapes

## Décision

### Système retenu : Middleware custom + Guards custom

L'authentification utilise **deux couches** distinctes et complémentaires :

#### Couche 1 — `AuthMiddleware` (middleware global)
```
Toutes les requêtes → AuthMiddleware → req.user = { id, email, role, platformRole, tenantId }
```
- S'exécute sur **toutes** les routes avant les guards
- Lit le JWT depuis `Cookie: token=xxx` ou `Authorization: Bearer xxx`
- En cas de token invalide : **ne lève pas d'exception** — laisse `req.user = undefined`
- Permet aux routes publiques de fonctionner sans avoir à bypasser le middleware

#### Couche 2 — `AuthGuard` (custom guard)
```
Routes protégées → AuthGuard → vérifie req.user !== null
```
- Lève `UnauthorizedException` si `req.user` est absent
- Décorateur `@Public()` pour bypasser les deux couches

#### Exception : Passport pour le login
La route `POST /auth/login` utilise `LocalAuthGuard` (Passport) pour le flow username/password.  
C'est le **seul** endroit où Passport intervient.

### Tokens

| Token | Durée | Stockage | Scope |
|---|---|---|---|
| `access_token` (JWT) | 15 min | Cookie httpOnly | `path: /` |
| `refresh_token` | 30 jours | Cookie httpOnly | `path: /api/v1/auth` |

- Le refresh token est stocké **hashé SHA-256** en DB
- La rotation est automatique à chaque refresh (token rotation)
- Maximum 5 refresh tokens actifs par utilisateur

### Ce qui a été supprimé (et pourquoi)

`JwtAuthGuard` (Passport JWT Guard) était utilisé dans certains controllers à côté du middleware custom. Ces deux mécanismes faisaient la même chose. `JwtAuthGuard` a été remplacé par `AuthGuard` (custom) sur toutes les routes, à l'exception du login qui nécessite `LocalAuthGuard`.

## Conséquences

**Positives :**
- Un seul mécanisme de vérification JWT → cohérence
- `req.user` a toujours la même forme dans toute l'app
- Plus simple à tester (mock de `req.user` suffit)

**Négatives / Points de vigilance :**
- `JwtAuthGuard` et `JwtStrategy` restent dans le code pour Passport (`LocalAuthGuard` en dépend) mais ne sont plus appelés directement
- Si Passport est retiré, `JwtStrategy` peut être supprimée

## Flux d'authentification

```
Client                     Frontend (Next.js)            Backend (NestJS)
──────                     ──────────────────            ────────────────
login form ──POST /login──────────────────────────────► LocalAuthGuard
                                                          │ AuthService.validateUser()
                                                          │ bcrypt.compare()
                                                          ▼
                           ◄── Set-Cookie: token (15m)  AuthService.login()
                           ◄── Set-Cookie: refreshToken  emailVerified check
                           ◄── { user }

// Requête authentifiée
api call ─────────────────Cookie: token──────────────►  AuthMiddleware
                                                          │ jwtService.verify()
                                                          │ req.user = { id, ... }
                                                          ▼
                                                         AuthGuard → req.user OK
                                                         TenantGuard → membership OK
                                                         RolesGuard → role OK
                                                          ▼
                           ◄── data                      Controller handler
```
