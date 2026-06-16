import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  lemonSqueezySetup,
  createCheckout,
} from '@lemonsqueezy/lemonsqueezy.js';
import {
  CheckoutSessionParams,
  CheckoutSessionResult,
  NormalizedPaymentEvent,
  PaymentProvider,
  PaymentProviderName,
} from '../../interfaces/payment-provider.interface';

/**
 * Fournisseur de paiement Lemon Squeezy — seul fournisseur actif/réel pour
 * le moment. Implémente le checkout par abonnement et la vérification des
 * webhooks (HMAC-SHA256, header X-Signature).
 */
@Injectable()
export class LemonSqueezyProvider implements PaymentProvider {
  readonly name: PaymentProviderName = 'lemonsqueezy';

  private readonly logger = new Logger(LemonSqueezyProvider.name);
  private readonly configured: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('LEMON_SQUEEZY_API_KEY');
    if (apiKey && !apiKey.includes('REPLACE')) {
      lemonSqueezySetup({ apiKey });
      this.configured = true;
    } else {
      this.configured = false;
      this.logger.warn(
        'Lemon Squeezy not configured — billing features disabled',
      );
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async createCheckoutSession(
    params: CheckoutSessionParams,
  ): Promise<CheckoutSessionResult> {
    const { tenantId, plan, returnUrl } = params;

    const storeId = this.config.get<string>('LEMON_SQUEEZY_STORE_ID');
    const variantId =
      plan === 'enterprise'
        ? this.config.get<string>('LEMON_SQUEEZY_ENTERPRISE_VARIANT_ID')
        : this.config.get<string>('LEMON_SQUEEZY_PRO_VARIANT_ID');

    if (!storeId || !variantId) {
      throw new BadRequestException(
        `Lemon Squeezy store/variant not configured for plan "${plan}"`,
      );
    }

    const { data: response, error } = await createCheckout(
      parseInt(storeId, 10),
      parseInt(variantId, 10),
      {
        checkoutData: {
          // custom_data est renvoyé dans tous les événements webhook liés
          custom: { tenant_id: tenantId, plan },
        },
        productOptions: {
          redirectUrl: `${returnUrl}/admin/billing?success=1`,
        },
      },
    );

    if (error) {
      this.logger.error('Lemon Squeezy checkout creation failed', error);
      throw new BadRequestException(
        'Impossible de créer la session de paiement',
      );
    }

    const url = (response as any)?.data?.attributes?.url as
      | string
      | undefined;
    if (!url) {
      throw new BadRequestException(
        'Lemon Squeezy did not return a checkout URL',
      );
    }

    return { url };
  }

  verifyWebhookSignature(payload: Buffer, signature: string): boolean {
    const secret =
      this.config.get<string>('LEMON_SQUEEZY_WEBHOOK_SECRET') ?? '';

    const digest = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // timingSafeEqual requires equal-length buffers — guard against malformed sigs
    const sigBuffer = Buffer.from(signature ?? '', 'hex');
    const digestBuffer = Buffer.from(digest, 'hex');

    return (
      sigBuffer.length === digestBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, digestBuffer)
    );
  }

  parseWebhookEvent(payload: Buffer): NormalizedPaymentEvent {
    let event: any;
    try {
      event = JSON.parse(payload.toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid webhook payload');
    }

    const providerEventName: string = event?.meta?.event_name ?? '';
    // LS fournit un webhook_id unique par tentative de livraison — utilisé pour l'idempotence
    const eventId: string =
      event?.meta?.webhook_id ?? `${providerEventName}-${Date.now()}`;
    const customData: Record<string, string> = event?.meta?.custom_data ?? {};
    const attr = event?.data?.attributes ?? {};

    const base = {
      eventId,
      providerEventName,
      tenantId: customData['tenant_id'],
      plan: customData['plan'],
      status: attr.status as string | undefined,
      currentPeriodEnd: attr.renews_at ? new Date(attr.renews_at) : null,
    };

    switch (providerEventName) {
      case 'subscription_created':
        return {
          ...base,
          type: 'subscription_created',
          subscriptionId: String(event.data?.id),
          customerId: String(attr.customer_id),
        };
      case 'subscription_updated':
        return {
          ...base,
          type: 'subscription_updated',
          subscriptionId: String(event.data?.id),
        };
      case 'subscription_cancelled':
      case 'subscription_expired':
        return {
          ...base,
          type: 'subscription_cancelled',
          subscriptionId: String(event.data?.id),
        };
      case 'subscription_payment_success':
        return {
          ...base,
          type: 'payment_succeeded',
          subscriptionId: String(attr.subscription_id),
        };
      case 'subscription_payment_failed':
        return {
          ...base,
          type: 'payment_failed',
          subscriptionId: String(attr.subscription_id),
        };
      default:
        return { ...base, type: 'unhandled' };
    }
  }
}
