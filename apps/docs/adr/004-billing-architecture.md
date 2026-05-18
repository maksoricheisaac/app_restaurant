# ADR-004 — Architecture Billing (Stripe)

**Date :** 2026-05-17  
**Statut :** Accepté

---

## Contexte

Flash Menu offre trois plans tarifaires : Free, Pro, Enterprise. Le plan détermine les limites d'usage (menu items, tables, staff, commandes/mois) et l'accès aux features.

## Décision

### Deux sources d'autorité distinctes

| Composant | Responsabilité |
|---|---|
| `plans.config.ts` | Définit les limites et features par plan (source of truth côté code) |
| `BillingService` | Gère les événements Stripe et met à jour `Tenant.plan` |
| `PlanLimitService` | Vérifie les quotas au moment de chaque opération |
| `FeatureFlagsService` | Combine les flags DB (overrides) + les defaults du plan |

### Flow de paiement

```
1. Owner clique "Upgrade" → POST /billing/checkout
2. Backend crée une Stripe Checkout Session
3. Client redirigé vers checkout.stripe.com
4. Paiement réussi → Stripe envoie checkout.session.completed (webhook)
5. BillingService.handleWebhook() → Tenant.plan = 'pro'
6. Toutes les prochaines requêtes utilisent le nouveau plan
```

### Webhooks Stripe gérés

| Événement | Action |
|---|---|
| `checkout.session.completed` | Activation plan + stockage stripeCustomerId/subscriptionId |
| `customer.subscription.updated` | Mise à jour plan + periode |
| `customer.subscription.deleted` | Downgrade vers free |
| `invoice.payment_succeeded` | Réactivation + clear grace period |
| `invoice.payment_failed` × 1-2 | Grace period 3 jours |
| `invoice.payment_failed` × 3+ | Suspension tenant |

### Idempotency

Chaque événement Stripe a un ID unique (`event.id`). Une Map en mémoire (TTL 25h) évite le double-traitement des retries Stripe.

**Pour multi-instance** : remplacer par Redis `SETNX event:{id} 1 EX 90000`.

### Plan enforcement

Les limites sont vérifiées **côté backend uniquement** — le frontend ne peut pas les bypasser :

```
POST /menu, POST /tables, POST /memberships/invite → assertXxxLimit()
POST /orders, POST /public-menu/:slug/order → assertMonthlyOrderLimit()
POST /permissions/staff → assertStaffMemberLimit()
```

Les limites sont lues depuis la DB à chaque opération (pas de cache). Pour les plans illimités (PRO/Enterprise), la vérification court-circuite sans requête DB.

### État abonnement dans Tenant

```prisma
plan                      TenantPlan         // free | pro | enterprise
status                    TenantStatus       // active | suspended | trial | expired
stripeCustomerId          String?            // @unique
stripeSubscriptionId      String?            // @unique
subscriptionStatus        String?            // active | past_due | canceled | ...
subscriptionCurrentPeriodEnd DateTime?
gracePeriodEndsAt         DateTime?          // 3 jours après payment_failed ×3
```

### Points de vigilance

1. **Plan downgrade** : les données existantes ne sont pas supprimées (restaurant FREE peut garder ses 20 articles, mais ne peut plus en créer). À documenter dans l'UX.
2. **Idempotency single-instance** : la Map en mémoire est perdue au redémarrage. Acceptable pour le moment (Stripe retente uniquement dans les 4 jours).
3. **stripeCustomerId backfill** : les tenants créés avant l'intégration Stripe n'ont pas de `stripeCustomerId` — il sera créé au prochain checkout.
