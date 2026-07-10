# ADR-004 — Architecture Billing (agnostique du fournisseur de paiement)

**Date :** 2026-05-17
**Mise à jour :** 2026-07-09 — remplacement de Stripe (jamais implémenté) puis de Lemon Squeezy (retiré) par une abstraction `PaymentProvider` ; aucun fournisseur concret n'est actif à ce jour. Le prochain fournisseur à implémenter est **Moneroo**.
**Statut :** Accepté

---

## Contexte

Flash Menu offre trois plans tarifaires : Free, Pro, Enterprise. Le plan détermine les limites d'usage (menu items, tables, staff, commandes/mois) et l'accès aux features.

Le fournisseur de paiement a déjà changé deux fois (Stripe → Lemon Squeezy → abandon de Lemon Squeezy). Pour que ce genre de changement ne redevienne jamais un chantier de plusieurs jours touchant le métier, toute la logique de facturation passe désormais par une interface `PaymentProvider` : `BillingService` ne connaît que cette interface et un événement normalisé (`NormalizedPaymentEvent`), jamais le SDK ou le format webhook d'un fournisseur en particulier.

## Décision

### Deux sources d'autorité distinctes

| Composant | Responsabilité |
|---|---|
| `plans.config.ts` | Définit les limites et features par plan (source of truth côté code) |
| `PaymentProviderFactory` + `PaymentProvider` | Sélectionne et expose le fournisseur actif (`apps/backend/src/payments/`) |
| `BillingService` | Traite les `NormalizedPaymentEvent` et met à jour `Tenant.plan` — agnostique du fournisseur |
| `PlanLimitService` | Vérifie les quotas au moment de chaque opération |
| `FeatureFlagsService` | Combine les flags DB (overrides) + les defaults du plan |

### Architecture de l'abstraction paiement

```
BillingController / BillingService
            │  ne connaît que :
            ▼
     PaymentProvider (interface)
            │
   ┌────────┴────────┬─────────────┬─────────────┐
   ▼                 ▼             ▼             ▼
StripeProvider   PaddleProvider  Flutterwave  Paystack
 (placeholder)    (placeholder)  (placeholder) (placeholder)
```

Chaque provider implémente :
- `isConfigured()` — indique si ses identifiants sont présents.
- `createCheckoutSession(params)` — crée une session de paiement et retourne son URL.
- `verifyWebhookSignature(payload, signature)` — DOIT échouer fermé (retourner `false`) si son secret n'est pas configuré ; utilise `verifyHmacSignature()` (`payments/utils/verify-hmac-signature.ts`), un helper HMAC-SHA256 à comparaison temps constant qui refuse de calculer une signature avec une clé vide.
- `parseWebhookEvent(payload)` — traduit le format propriétaire du fournisseur vers `NormalizedPaymentEvent`.

**Aucun fournisseur n'est implémenté aujourd'hui.** `stripe`, `paddle`, `flutterwave`, `paystack` sont des classes placeholder : `isConfigured()` retourne toujours `false`, et toute tentative de checkout ou de parsing webhook lève une erreur explicite. `PaymentProviderFactory.getProvider()` lève lui-même une erreur claire si `PAYMENT_PROVIDER` n'est pas défini — pas de fallback silencieux vers un provider inactif.

### Ajouter un nouveau fournisseur (ex. Moneroo)

1. Ajouter son nom à `PaymentProviderName` (`payments/interfaces/payment-provider.interface.ts`).
2. Créer `payments/providers/moneroo/moneroo.provider.ts` implémentant `PaymentProvider`.
3. L'enregistrer dans `PaymentProviderFactory` (une ligne).
4. Ajouter ses variables d'environnement (`MONEROO_API_KEY`, `MONEROO_WEBHOOK_SECRET`, ...) à `config.validation.ts` et `.env.example`.

Aucune autre couche (`BillingService`, `BillingController`, DTOs, frontend) n'a besoin d'être modifiée.

### Flow de paiement (une fois un provider implémenté)

```
1. Owner clique "Upgrade" → POST /billing/checkout
2. BillingService délègue à provider.createCheckoutSession()
3. Client redirigé vers la page de paiement du fournisseur
4. Paiement réussi → le fournisseur envoie un webhook
5. provider.verifyWebhookSignature() + provider.parseWebhookEvent()
   → NormalizedPaymentEvent
6. BillingService.handleWebhook() → Tenant.plan = 'pro' (logique commune,
   indépendante du fournisseur)
7. Toutes les prochaines requêtes utilisent le nouveau plan
```

### Événements normalisés gérés par BillingService

| NormalizedPaymentEventType | Action |
|---|---|
| `subscription_created` | Activation plan + stockage `paymentProvider`/`paymentCustomerId`/`paymentSubscriptionId` |
| `subscription_updated` | Mise à jour plan + période |
| `subscription_cancelled` | Downgrade vers free |
| `payment_succeeded` | Réactivation + clear grace period |
| `payment_failed` × 1-2 | Grace period 3 jours |
| `payment_failed` × 3+ | Suspension tenant |

Chaque `PaymentProvider` concret est responsable de traduire les événements propriétaires de son fournisseur (ex. `checkout.session.completed` chez Stripe, `subscription_payment_success` chez Lemon Squeezy) vers ce type commun.

### Idempotency

Chaque événement normalisé porte un `eventId` unique. `IdempotencyService` (Redis, avec repli en mémoire mono-instance) évite le double-traitement des retries webhook, sur une fenêtre de 25h — voir ADR-005.

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
paymentProvider           String?            // "moneroo", "stripe"... — quel provider a créé l'abonnement
paymentCustomerId         String?            // unicité imposée par un index partiel (voir migration dédiée)
paymentSubscriptionId     String?            // idem
subscriptionStatus        String?            // active | past_due | canceled | ...
subscriptionCurrentPeriodEnd DateTime?
gracePeriodEndsAt         DateTime?          // 3 jours après payment_failed ×3
```

### Points de vigilance

1. **Plan downgrade** : les données existantes ne sont pas supprimées (restaurant FREE peut garder ses 20 articles, mais ne peut plus en créer). À documenter dans l'UX.
2. **`paymentCustomerId`/`paymentSubscriptionId` backfill** : les tenants créés avant l'intégration d'un fournisseur de paiement n'ont pas ces champs — ils seront créés au prochain checkout.
3. **Webhook secret obligatoire en production** : un `PaymentProvider` dont `verifyWebhookSignature()` accepterait une signature alors que son secret n'est pas configuré serait une faille de falsification de facturation — voir le helper `verifyHmacSignature()`, qui échoue fermé par construction.
