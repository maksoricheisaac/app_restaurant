# Gestion des secrets — Flash Menu

## Règles

1. **Aucun secret réel ne doit jamais être commité.** Les fichiers `.env`, `.env.local`,
   `.env.*.local` sont ignorés par git (voir `.gitignore`). Seuls les fichiers
   `*.env.example` sont trackés, et ne doivent contenir **que des placeholders**
   (`REPLACE_...`, `CHANGE_ME`, etc.) — jamais de valeurs fonctionnelles.
2. Chaque environnement (dev / staging / production) a son propre `JWT_SECRET`,
   `BLOB_READ_WRITE_TOKEN`, clés de paiement, etc. Ne jamais réutiliser un secret
   de production en local.
3. Toute rotation de secret invalide les sessions actives qui en dépendent
   (ex: changer `JWT_SECRET` déconnecte tous les utilisateurs). Planifier la
   rotation en conséquence.

## Scan automatique des secrets

### CI (obligatoire, déjà actif)

Le job **`secrets`** de `apps/.github/workflows/ci.yml` exécute
[Gitleaks](https://github.com/gitleaks/gitleaks) sur chaque push et pull request,
avec la configuration `.gitleaks.toml` (racine du repo). Toute détection fait
échouer le build.

### Hook local (recommandé)

Pour scanner avant chaque commit :

```bash
# 1. Installer gitleaks (une fois)
#    macOS:   brew install gitleaks
#    Windows: scoop install gitleaks  (ou voir releases GitHub)
#    Linux:   voir https://github.com/gitleaks/gitleaks#installing

# 2. Activer les hooks du repo (une fois par clone)
git config core.hooksPath .githooks
```

Le hook `.githooks/pre-commit` bloque le commit si un secret est détecté dans
les fichiers stagés. Si gitleaks n'est pas installé, le hook avertit mais ne
bloque pas (la CI scanne quand même au push).

### Faux positifs

Ajouter une entrée dans `[allowlist]` de `.gitleaks.toml` (regex ou chemin),
avec un commentaire expliquant pourquoi c'est sûr.

## Procédure en cas de fuite de secret

1. **Rotation immédiate** du secret concerné (JWT_SECRET, tokens Blob, clés de
   paiement, etc.) dans l'environnement affecté.
2. Si le secret a été **commité** (même une seule fois dans l'historique) :
   considérer le secret comme compromis définitivement — la rotation est
   obligatoire même après suppression du commit, car l'historique git peut
   avoir été cloné/mis en cache (forks, CI logs, etc.).
3. Vérifier les logs d'accès du service concerné (Vercel Blob, Sentry, base de
   données, fournisseur de paiement) pour un usage anormal pendant la fenêtre
   d'exposition.
4. Documenter l'incident (date, secret concerné, durée d'exposition, actions
   prises) dans le suivi interne.

## Inventaire des secrets (backend)

| Variable | Usage | Rotation impact |
|---|---|---|
| `JWT_SECRET` | Signature des access/refresh tokens | Déconnecte toutes les sessions |
| `MENU_SESSION_SECRET` | HMAC anti-flood des sessions de commande publiques | Sessions de commande en cours invalidées |
| `BLOB_READ_WRITE_TOKEN` | Accès Vercel Blob (upload médias) | Aucun impact utilisateur, juste re-déploiement |
| `SENTRY_DSN` | Reporting d'erreurs | Aucun impact fonctionnel |
| `REDIS_URL` / `REDIS_PASSWORD` | Rate limiting distribué, idempotence webhooks, Socket.io adapter | Voir `docs/adr/005-redis-scaling-strategy.md` |
| `PAYMENT_PROVIDER` + secrets par provider | Voir `docs/adr/004-billing-architecture.md` (architecture agnostique) | Dépend du provider actif |
| `SMTP_*` | Envoi d'emails (auth, notifications) | Aucun impact sur les sessions |
| `SEED_ADMIN_PASSWORD` / `SEED_MANAGER_PASSWORD` | Comptes de seed (dev/test uniquement) | Jamais utilisé en production |
