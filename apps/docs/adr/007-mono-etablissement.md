# ADR-007 — Passage au mono-établissement

**Date :** 2026-08-02
**Statut :** Accepté
**Remplace :** ADR-002 (isolation multi-tenant), ADR-004 (architecture de facturation)

---

## Contexte

Flash Menu a été conçu comme une plateforme SaaS B2B : plusieurs restaurants
partageaient la même infrastructure, chacun identifié par un `Tenant`, avec un
plan tarifaire, des quotas, un abonnement et un sous-domaine.

Le produit n'est plus commercialisé sous cette forme. Il est désormais installé
pour **un seul établissement**, comme un logiciel de gestion classique (Toast,
Lightspeed, SambaPOS en mono-site).

Maintenir l'appareillage multi-tenant dans ce contexte revenait à payer, sur
chaque requête et chaque écran, le coût d'une dimension qui n'a plus qu'une
seule valeur possible.

## Décision

### 1. Le cloisonnement disparaît de la base, pas seulement du code

Toutes les colonnes `tenantId` ont été **supprimées** — 21 tables concernées.
Ce n'est pas un détail d'implémentation : tant que la colonne existe, chaque
nouvelle requête doit penser à la filtrer, et un oubli est une fuite de
données. En la supprimant, on rend cette classe de bugs **structurellement
impossible** plutôt que simplement improbable.

Tables supprimées : `Tenant`, `Plan`, `TenantMembership`, `Domain`,
`FeatureFlag`, `RestaurantSettings`.

### 2. Un singleton garanti par la base

La configuration de l'établissement vit dans une table `Restaurant` dont la
clé primaire est verrouillée par une contrainte SQL :

```sql
ALTER TABLE "Restaurant"
  ADD CONSTRAINT "Restaurant_singleton_check" CHECK ("id" = 'restaurant');
```

Créer un second établissement échoue au niveau de PostgreSQL, pas au niveau
d'un test applicatif que l'on pourrait contourner. C'est aussi ce qui rend
l'assistant de première installation rejouable sans risque : un second appel
concurrent viole la clé primaire et est rejeté.

### 3. Le rôle remonte sur le compte

`TenantMembership` a disparu ; `User.role` porte désormais le rôle
(`owner | manager | waiter | chef | cashier`, contraint par un CHECK).

Conséquence directe sur le chemin critique : l'ancienne chaîne faisait **deux
requêtes SQL par appel authentifié** (résolution du tenant, puis du
membership). La nouvelle en fait **une seule** — la lecture du compte — et
cette requête relit le rôle et le statut à jour. Une rétrogradation ou une
désactivation prend donc effet immédiatement, alors qu'avec un rôle porté par
le JWT elle aurait attendu jusqu'à 15 minutes.

### 4. Le jeton ne porte plus que l'identité

`{ sub, email }` — rien d'autre. Les anciens claims `role`, `platformRole` et
`tenantId` ont été retirés. Un jeton ne peut plus accorder de droits ; il ne
fait qu'identifier son porteur, les droits étant décidés en base.

### 5. Un salon WebSocket unique

Les rooms `tenant-{id}` ont disparu au profit d'un salon `staff` unique,
rejoint automatiquement à la poignée de main par tout membre du personnel
authentifié et actif. Le client n'a plus rien à émettre pour cela, et il n'y a
plus de `join-tenant` dont l'oubli laissait un poste muet.

Le suivi public d'une commande garde son salon dédié
(`order-tracking-{orderId}`), puisque le client anonyme désigne une commande
précise.

### 6. Ce qui a disparu avec le SaaS

- **Facturation** : module `billing`, webhooks, abstraction `PaymentProvider`
  (Stripe/Paddle/Flutterwave/Paystack). L'encaissement **client** reste — c'est
  le module `cash-register`, qui n'a jamais eu de rapport avec l'abonnement.
- **Plans et quotas** : table `Plan`, `PlanLimitService`, `FeatureFlagsService`.
  Toutes les fonctionnalités sont disponibles : le logiciel est installé, il
  n'y a rien à débloquer.
- **Administration de plateforme** : tout `/super-admin`, l'enum `PlatformRole`.
- **Sous-domaines** : table `Domain`, résolution par slug, en-têtes
  `x-tenant-id` / `x-tenant-slug`.

## Conséquences

### Positives

- Une requête SQL de moins sur chaque appel authentifié.
- Les index composites `(tenantId, x)` deviennent des index simples sur `x` :
  plus étroits, donc plus de lignes par page mémoire.
- L'oubli d'un filtre de sécurité n'est plus possible.
- Deux modules (`settings`, `tenants`) fusionnent en un seul (`restaurant`),
  et deux services concurrents de gestion du personnel (`memberships` et la
  moitié de `permissions`) fusionnent en `staff`.

### Négatives assumées

- **La migration est irréversible.** Le script
  `20260802000000_single_restaurant` élit un établissement survivant et
  supprime les données de tous les autres. Voir
  `docs/MIGRATION_SINGLE_RESTAURANT.md`.
- Revenir au multi-tenant demanderait de refaire le trajet inverse en
  entier — c'est le prix de la simplification, et il est assumé.
- Le rôle étant relu en base à chaque requête, une charge très élevée
  demanderait un cache court sur cette lecture. Ce n'est pas un problème à
  l'échelle d'un établissement (quelques dizaines de postes au plus).

## Alternatives écartées

**Garder `tenantId` avec une valeur constante.** Migration plus courte, mais
on conservait exactement ce qu'on voulait supprimer : la discipline de filtrage
sur chaque requête, les index composites, et la possibilité d'oublier le
filtre. Le gain de la simplification venait précisément de la suppression de
la colonne.

**Garder le rôle dans le JWT pour éviter la requête.** Cela aurait fait zéro
requête au lieu d'une, mais au prix d'une fenêtre de 15 minutes pendant
laquelle un employé rétrogradé ou licencié conserve ses droits. Inacceptable
pour un logiciel de caisse.
