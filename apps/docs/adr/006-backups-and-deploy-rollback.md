# ADR-006 — Sauvegardes, déploiement et rollback

**Date :** 2026-07-09
**Statut :** Accepté — politique documentée, exécution manuelle (pas encore automatisée)

---

## Contexte

L'audit de production-readiness a identifié deux angles morts opérationnels :

1. **Aucune politique de sauvegarde/restauration PostgreSQL** n'existait dans le dépôt — aucun objectif de RPO/RTO écrit, aucune preuve de restauration testée.
2. **Aucune stratégie de déploiement/rollback documentée** — la CI publie des images Docker taguées vers GHCR (`ghcr.io/<repo>/backend:<sha>` et `:latest`), mais rien n'automatise ensuite leur déploiement, et il n'existe aucune procédure écrite pour revenir en arrière après un déploiement problématique.

Ce document ne prétend pas automatiser ces deux sujets (hors scope de cette session), mais fixe la politique minimale à respecter avant toute mise en production réelle, pour qu'un incident ne découvre pas l'absence de plan au moment où il compte le plus.

## Décision — Sauvegardes

### Objectifs (RPO / RTO)

| | Cible |
|---|---|
| RPO (perte de données maximale tolérée) | ≤ 1 heure |
| RTO (temps de restauration maximal) | ≤ 4 heures |

### Politique

- **Sauvegarde automatique quotidienne minimum**, avec rétention ≥ 30 jours. Si l'hébergeur PostgreSQL est managé (Vercel Postgres, Supabase, RDS, Neon, etc.), utiliser ses sauvegardes automatiques natives (PITR — Point-In-Time Recovery — si disponible, pour respecter le RPO d'1h) plutôt que de réinventer un mécanisme de `pg_dump` planifié.
- Si l'hébergement est auto-géré (VM/conteneur Postgres sans PITR managé), planifier :
  ```bash
  pg_dump --format=custom --file="flash_menu_$(date +%Y%m%d_%H%M%S).dump" "$DATABASE_URL"
  ```
  vers un stockage objet distinct de l'instance applicative (S3/Blob), avec rotation.
- Le fichier `.env` (secrets) et `BLOB_READ_WRITE_TOKEN` (stockage des images Vercel Blob) sont **hors périmètre** de cette sauvegarde base de données — leur perte n'est pas couverte par un restore Postgres et doit être gérée séparément (gestionnaire de secrets de l'hébergeur CI/CD).

### Test de restauration — OBLIGATOIRE avant le premier lancement en production

Une sauvegarde jamais restaurée n'est pas une sauvegarde. Avant toute mise en production :

1. Restaurer le dernier backup sur une base de données de test (`flash_menu_restore_test`).
2. Lancer `pnpm exec prisma migrate status` dessus pour confirmer que le schéma restauré correspond aux migrations appliquées.
3. Vérifier un échantillon de données métier critiques (tenants, commandes, paiements) via une requête de contrôle.
4. Consigner la date et le résultat de ce test — à répéter au minimum trimestriellement.

## Décision — Déploiement

### État actuel (ce que la CI fait réellement)

`.github/workflows/ci.yml`, job `publish` (déclenché sur push vers `main`) :
1. Build les images `backend` et `frontend`.
2. Les pousse vers `ghcr.io/<repo>/backend:{sha,latest}` et `ghcr.io/<repo>/frontend:{sha,latest}`.

**Rien n'automatise le déploiement de ces images vers l'environnement de production.** C'est un processus manuel, hors dépôt, dont la mécanique exacte dépend de l'hébergeur choisi (non figé à la date de cet ADR).

### Politique minimale jusqu'à l'automatisation

1. **Ne jamais déployer `:latest` en aveugle.** Toujours déployer le tag `:<sha>` correspondant au commit explicitement validé (permet un rollback ciblé — voir ci-dessous).
2. **Avant chaque déploiement en production**, confirmer :
   - Le job CI complet (`secrets`, `backend`, `frontend`, `docker`) est vert sur le commit à déployer.
   - Les migrations Prisma en attente ont été identifiées (`pnpm exec prisma migrate status` côté production) et sont compatibles avec la version actuellement déployée (voir règle de compatibilité ci-dessous).
3. **Migrations toujours additives/rétro-compatibles au moment du déploiement** : une migration qui supprime une colonne/table encore lue par l'ancienne version du code casse le déploiement pendant la fenêtre de transition. Préférer le pattern *expand/contract* : d'abord ajouter (déployable avec l'ancien code), déployer le nouveau code, puis seulement dans un déploiement ultérieur retirer l'ancien.

### Rollback

En cas de problème détecté après déploiement :

1. **Rollback applicatif** : redéployer immédiatement le tag `:<sha>` précédent connu-stable (déjà présent dans GHCR grâce au tagging par commit — aucune reconstruction nécessaire).
2. **Rollback de migration** : Prisma Migrate ne fournit pas de "down migration" automatique. Si le déploiement problématique incluait une migration :
   - Si la migration était additive (nouvelle colonne/table nullable) : aucune action DB nécessaire, le rollback applicatif suffit.
   - Si la migration était destructive (colonne supprimée/renommée) : elle ne doit **jamais** avoir été déployée seule sans respecter le pattern expand/contract ci-dessus ; un vrai rollback nécessite de restaurer depuis la sauvegarde la plus récente antérieure au déploiement (voir RTO ci-dessus).
3. **Post-mortem** : consigner la cause, le délai de détection, le délai de résolution — pas de blâme individuel, objectif d'amélioration du processus.

### Prochaine étape (hors scope de cette session)

Automatiser le déploiement (ex. job GitHub Actions supplémentaire déclenchant un déploiement sur l'hébergeur cible après `publish`, avec un gate d'approbation manuelle) et un rollback en un clic. Tant que ce n'est pas fait, la présente politique manuelle est la référence à suivre.
