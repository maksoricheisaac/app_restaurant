# Migration — de la plateforme SaaS au logiciel mono-établissement

> **Cette migration est destructive et irréversible.** Elle supprime
> définitivement les données de tous les établissements sauf un.
> Ne l'exécutez pas sans sauvegarde vérifiée.

---

## 0. État de validation

Cette migration a été **exécutée sur une copie intégrale d'une base réelle**
(15 établissements), pas seulement relue. Deux passes : élection automatique
de l'établissement, puis établissement forcé via `SET LOCAL`. Tous les
invariants ont été vérifiés après coup — un seul restaurant, un seul
propriétaire, zéro colonne `tenantId`, historique comptable intact.

Cela ne dispense **pas** de la sauvegarde exigée au § 2.1 : votre base a ses
propres données, et notamment ses propres valeurs de `TenantMembership.role`,
qui étaient précisément la source du premier défaut corrigé.

---

## 1. Ce que fait la migration

Migration : `apps/backend/prisma/migrations/20260802000000_single_restaurant`

| Étape | Effet |
|---|---|
| 1 | Élit l'établissement survivant — le plus ancien `Tenant` actif, ou celui que vous désignez |
| 2 | Supprime tous les autres tenants (cascade : commandes, cartes, tables, paiements, stock…) |
| 3 | Fusionne `Tenant` + `RestaurantSettings` dans la table singleton `Restaurant` |
| 4 | Fait remonter `TenantMembership.role` sur `User.role`, puis supprime la table de liaison |
| 5 | Renomme `MembershipInvite` en `StaffInvite` |
| 6 | Supprime la colonne `tenantId` de **21 tables** |
| 7 | Supprime `Tenant`, `Plan`, `TenantMembership`, `Domain`, `FeatureFlag`, `RestaurantSettings` et les enums `TenantStatus`, `PlatformRole` |
| 8 | Reconstruit les index sans dimension tenant |

### Décisions prises par la migration

**Fusion des rôles.** L'ancien `head_chef` devient `chef` : le nouveau modèle
n'en conserve que cinq (`owner`, `manager`, `waiter`, `chef`, `cashier`). Le
chef hérite des droits de l'ancien chef de cuisine (carte + stock).

`TenantMembership.role` étant un `TEXT` libre, la conversion est **exhaustive**
et se termine par un repli `ELSE 'waiter'` : une valeur inattendue rétrograde
le compte au rôle le moins privilégié plutôt que de faire échouer toute la
migration sur la contrainte `CHECK`. Les valeurs historiques connues sont
traitées explicitement (`admin` → `manager`, `head_chef` → `chef`).

**Propriétaire unique garanti.** Après conversion, la migration promeut le plus
ancien compte actif s'il n'y a aucun propriétaire, et rétrograde les
surnuméraires s'il y en a plusieurs. L'invariant « exactement un propriétaire »
tient donc dès la première requête post-migration.

**Comptes hors établissement.** Les comptes sans rattachement à
l'établissement survivant — comptes d'autres restaurants, super-admins et
supports de plateforme — sont :
- **supprimés** si aucune écriture comptable ne les référence ;
- **désactivés** (`status = 'inactive'`) sinon, car les clés étrangères de
  `Payment`, `Transaction` et `CashRegisterSession` sont volontairement en
  `RESTRICT` pour protéger l'historique financier.

---

## 2. Avant d'exécuter

### 2.1 Sauvegarder

```bash
pg_dump -Fc -d "$DATABASE_URL" -f flashmenu-avant-migration.dump
```

**Vérifiez la sauvegarde** en la restaurant sur une base jetable — une
sauvegarde non testée n'est pas une sauvegarde :

```bash
createdb flashmenu_verif
pg_restore -d flashmenu_verif flashmenu-avant-migration.dump
psql -d flashmenu_verif -c 'SELECT count(*) FROM "Order";'
```

### 2.2 Choisir l'établissement à conserver

Listez les candidats :

```sql
SELECT t.id, t.name, t.slug, t."createdAt",
       (SELECT count(*) FROM "Order" o WHERE o."tenantId" = t.id) AS commandes,
       (SELECT count(*) FROM "TenantMembership" m WHERE m."tenantId" = t.id) AS equipe
FROM "Tenant" t
WHERE t."deletedAt" IS NULL
ORDER BY commandes DESC;
```

Par défaut, la migration retient **le plus ancien tenant actif**. Si ce n'est
pas celui que vous voulez, forcez-le explicitement (voir 3.2).

### 2.3 Fenêtre de maintenance

Coupez le trafic : la migration supprime des tables et réécrit des index, elle
prend des verrous exclusifs. Comptez quelques secondes sur une base d'un
établissement, davantage si vous supprimez des dizaines de tenants volumineux.

---

## 3. Exécuter

### 3.1 Cas standard — le plus ancien tenant actif

```bash
cd apps/backend
npx prisma migrate deploy
npx prisma generate
```

### 3.2 Forcer un établissement précis

`prisma migrate deploy` ne permet pas de passer une variable de session. Pour
désigner un tenant, appliquez le SQL à la main dans une transaction :

```bash
psql "$DATABASE_URL" <<SQL
BEGIN;
SET LOCAL flashmenu.tenant_id = '<UUID-DU-TENANT>';
\i prisma/migrations/20260802000000_single_restaurant/migration.sql
COMMIT;
SQL
```

Puis marquez la migration comme appliquée pour que Prisma reste synchronisé :

```bash
npx prisma migrate resolve --applied 20260802000000_single_restaurant
npx prisma generate
```

---

## 4. Après la migration

### 4.1 Contrôles

```sql
-- Exactement un établissement, et il est marqué configuré
SELECT id, name, "setupCompleted" FROM "Restaurant";

-- Exactement un propriétaire
SELECT role, count(*) FROM "User" GROUP BY role;

-- Plus aucune colonne de cloisonnement
SELECT table_name FROM information_schema.columns WHERE column_name = 'tenantId';
-- → 0 ligne attendue

-- L'historique comptable est intact
SELECT count(*) FROM "Payment";
SELECT count(*) FROM "Order" WHERE "deletedAt" IS NULL;
```

### 4.2 Variables d'environnement à retirer

Ces variables ne sont plus lues. Supprimez-les de vos `.env`, de votre gestionnaire
de secrets et de votre CI :

```
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
PADDLE_*, FLUTTERWAVE_*, PAYSTACK_*, LEMONSQUEEZY_*
PAYMENT_PROVIDER
SEED_ADMIN_PASSWORD          → remplacée par SEED_OWNER_PASSWORD
E2E_TEST_SLUG
```

### 4.3 Redéployer les deux applications

Backend et frontend doivent être déployés **ensemble** : les contrats d'API ont
changé (routes `/tenants`, `/memberships`, `/billing`, `/plans` supprimées ;
`/restaurant`, `/staff`, `/setup` ajoutées ; `/public-menu/:slug` devient
`/public-menu`).

### 4.4 Ce qui change pour les utilisateurs

| Avant | Après |
|---|---|
| `https://mon-resto.flashmenu.app/menu/mon-resto` | `https://<votre-domaine>/menu` |
| QR codes pointant vers `/menu/{slug}?tableId=…` | `/menu?tableId=…` — **les QR codes imprimés doivent être régénérés** |
| Inscription publique `/auth/register` | Supprimée. Première installation via `/setup`, puis invitations |
| Rôle `head_chef` | Fusionné dans `chef` |
| Sessions actives | **Invalidées** : les anciens jetons portent des claims qui n'existent plus. Tout le monde se reconnecte. |

> ⚠️ **Les QR codes de table changent d'URL.** Prévoyez la réimpression avant
> la bascule, ou gardez temporairement une redirection `/menu/:slug → /menu`
> côté reverse-proxy.

---

## 5. Rollback

Il n'y a pas de rollback applicatif : la migration supprime des tables et des
colonnes. Le seul retour arrière est la **restauration de la sauvegarde**,
accompagnée d'un redéploiement de la version précédente des deux applications.

```bash
dropdb flashmenu && createdb flashmenu
pg_restore -d flashmenu flashmenu-avant-migration.dump
```

C'est précisément pour cette raison que l'étape 2.1 exige une sauvegarde
**vérifiée** et non simplement produite.

---

## 6. Installation neuve (pas de données existantes)

Si vous partez d'une base vierge, il n'y a rien à migrer :

```bash
cd apps/backend
npx prisma migrate deploy
npx prisma generate
pnpm start:prod
```

Puis ouvrez `/setup` dans le navigateur : l'assistant crée l'établissement, le
propriétaire, les permissions par défaut, les horaires et la carte initiale —
le tout dans une transaction unique. Il ne réapparaîtra plus jamais.
