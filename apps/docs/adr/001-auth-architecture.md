# ADR-001 — Architecture d'authentification

**Date :** 2026-05-17
**Statut :** Accepté — révisé le 2026-08-02 (voir ADR-007)

---

## Contexte

Flash Menu est un logiciel mono-établissement. L'authentification doit gérer :
1. La connexion locale (email + mot de passe)
2. La vérification de JWT sur chaque requête
3. Le refresh silencieux des tokens expirés
4. La première installation, qui crée le propriétaire

## Décision

### Système retenu : Middleware custom + Guards custom

L'authentification utilise **deux couches** distinctes et complémentaires :

#### Couche 1 — `AuthMiddleware` (middleware global)
```
Toutes les requêtes → AuthMiddleware → req.user = { id, email }
```
- S'exécute sur **toutes** les routes avant les guards
- Lit le JWT depuis `Cookie: token=xxx` ou `Authorization: Bearer xxx`
- En cas de token invalide : **ne lève pas d'exception** — laisse `req.user = undefined`
- Permet aux routes publiques de fonctionner sans avoir à bypasser le middleware

#### Couche 2 — `AuthGuard` (custom guard)
```
Routes protégées → AuthGuard → charge le compte en base → req.user = { id, email, name, role, status }
```
- Lève `UnauthorizedException` si `req.user` est absent ou si le compte n'existe plus
- Lève `ForbiddenException` si le compte n'est pas `active`
- Décorateur `@Public()` pour bypasser les deux couches

**Le rôle n'est jamais lu depuis le JWT.** Il est relu en base à chaque
requête, pour qu'une rétrogradation ou une désactivation prenne effet
immédiatement plutôt qu'à l'expiration du jeton (jusqu'à 15 min plus tard).
C'est une requête SQL — la même que celles que faisait déjà l'ancienne chaîne
multi-tenant, en deux fois.

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
                                                          │ req.user = { id, email }
                                                          ▼
                                                         AuthGuard → compte relu en base
                                                         RolesGuard → rôle OK (en mémoire)
                                                          ▼
                           ◄── data                      Controller handler
```
