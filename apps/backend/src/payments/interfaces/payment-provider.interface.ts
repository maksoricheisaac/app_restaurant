/**
 * Fournisseurs de paiement reconnus par l'application. Tous sont, pour
 * l'instant, des placeholders inertes (voir providers/*) — aucun n'est
 * implémenté.
 *
 * Pour ajouter un nouveau fournisseur (ex: Moneroo, PawaPay, CinetPay) :
 *   1. Ajouter son nom à cette union.
 *   2. Créer providers/<nom>/<nom>.provider.ts implémentant PaymentProvider
 *      (s'inspirer de providers/stripe pour la forme d'un placeholder, ou
 *      d'une vraie implémentation avec SDK/appels HTTP une fois les
 *      identifiants disponibles).
 *   3. L'enregistrer dans PaymentProviderFactory (une ligne).
 * Aucune autre couche (BillingService, BillingController, DTOs) n'a besoin
 * d'être modifiée : elles ne parlent qu'à l'interface PaymentProvider et à
 * NormalizedPaymentEvent.
 */
export type PaymentProviderName =
  | 'stripe'
  | 'paddle'
  | 'flutterwave'
  | 'paystack';

/**
 * Clé du plan souscrit (Plan.key). Les plans étant désormais pilotés par les
 * données (table Plan), ce n'est plus une union figée : chaque provider mappe
 * cette clé vers son identifiant de prix/tarif interne.
 */
export type SubscriptionPlan = string;

export interface CheckoutSessionParams {
  tenantId: string;
  tenantName: string;
  plan: SubscriptionPlan;
  returnUrl: string;
}

export interface CheckoutSessionResult {
  url: string;
}

export type NormalizedPaymentEventType =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'unhandled';

/**
 * Événement webhook normalisé, indépendant du fournisseur de paiement.
 * Chaque provider traduit son format propriétaire vers cette forme commune
 * afin que BillingService puisse appliquer la même logique métier
 * (mise à jour du tenant) quel que soit le fournisseur actif.
 */
export interface NormalizedPaymentEvent {
  type: NormalizedPaymentEventType;
  /** Identifiant unique de la livraison du webhook, utilisé pour l'idempotence. */
  eventId: string;
  /** Nom brut de l'événement chez le fournisseur (utile pour les logs/debug). */
  providerEventName: string;
  /**
   * Renseigné par BillingService juste après l'appel à parseWebhookEvent
   * (pas par le provider lui-même) — identifie quel PaymentProvider a
   * généré l'événement, pour traçabilité sur Tenant.paymentProvider.
   */
  providerName?: PaymentProviderName;
  tenantId?: string;
  plan?: string;
  subscriptionId?: string;
  customerId?: string;
  status?: string;
  currentPeriodEnd?: Date | null;
}

/**
 * Contrat commun à tous les fournisseurs de paiement (Stripe, Paddle,
 * Flutterwave, Paystack, et bientôt Moneroo...). Permet à BillingService de
 * rester agnostique du fournisseur sélectionné via PaymentProviderFactory.
 */
export interface PaymentProvider {
  readonly name: PaymentProviderName;

  /** True si les identifiants/clés nécessaires sont configurés. */
  isConfigured(): boolean;

  createCheckoutSession(
    params: CheckoutSessionParams,
  ): Promise<CheckoutSessionResult>;

  /**
   * DOIT retourner false si le secret de vérification n'est pas configuré
   * (ne jamais calculer un HMAC avec une clé vide). Utiliser
   * `verifyHmacSignature` de `payments/utils/verify-hmac-signature.ts`, qui
   * échoue fermé par construction, plutôt que de réimplémenter la
   * comparaison de signature dans chaque provider.
   */
  verifyWebhookSignature(payload: Buffer, signature: string): boolean;

  parseWebhookEvent(payload: Buffer): NormalizedPaymentEvent;
}
