export type PaymentProviderName =
  | 'lemonsqueezy'
  | 'stripe'
  | 'paddle'
  | 'flutterwave'
  | 'paystack';

export type SubscriptionPlan = 'pro' | 'enterprise';

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
  tenantId?: string;
  plan?: string;
  subscriptionId?: string;
  customerId?: string;
  status?: string;
  currentPeriodEnd?: Date | null;
}

/**
 * Contrat commun à tous les fournisseurs de paiement (Lemon Squeezy, Stripe,
 * Paddle, Flutterwave, Paystack...). Permet à BillingService de rester
 * agnostique du fournisseur sélectionné via PaymentProviderFactory.
 */
export interface PaymentProvider {
  readonly name: PaymentProviderName;

  /** True si les identifiants/clés nécessaires sont configurés. */
  isConfigured(): boolean;

  createCheckoutSession(
    params: CheckoutSessionParams,
  ): Promise<CheckoutSessionResult>;

  verifyWebhookSignature(payload: Buffer, signature: string): boolean;

  parseWebhookEvent(payload: Buffer): NormalizedPaymentEvent;
}
