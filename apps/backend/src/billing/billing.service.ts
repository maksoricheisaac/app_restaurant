import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProviderFactory } from '../payments/payment-provider.factory';
import { NormalizedPaymentEvent } from '../payments/interfaces/payment-provider.interface';
import { IdempotencyService } from '../common/redis/idempotency.service';

const GRACE_PERIOD_DAYS = 3;

// Webhook idempotency window — providers retry failed deliveries for up to 25h.
// Backed by Redis (multi-instance) with an in-memory fallback (single instance).
const PROCESSED_EVENT_TTL_SECONDS = 25 * 60 * 60; // 25h

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentProviders: PaymentProviderFactory,
    private readonly idempotency: IdempotencyService,
  ) {}

  // ─── Checkout ─────────────────────────────────────────────────────────────

  async createCheckoutSession(
    tenantId: string,
    plan: 'pro' | 'enterprise',
    returnUrl: string,
  ) {
    const provider = this.paymentProviders.getProvider();
    if (!provider.isConfigured()) {
      throw new BadRequestException(
        `Le fournisseur de paiement "${provider.name}" n'est pas configuré`,
      );
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    });
    if (!tenant) throw new BadRequestException('Tenant not found');

    return provider.createCheckoutSession({
      tenantId,
      tenantName: tenant.name,
      plan,
      returnUrl,
    });
  }

  // ─── Webhook handler ──────────────────────────────────────────────────────

  async handleWebhook(payload: Buffer, signature: string) {
    const provider = this.paymentProviders.getProvider();

    if (!provider.verifyWebhookSignature(payload, signature)) {
      this.logger.error('Webhook signature validation failed');
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = provider.parseWebhookEvent(payload);
    event.providerName = provider.name;

    this.logger.log(
      `${provider.name} event: ${event.providerEventName} (id=${event.eventId})`,
    );

    // Idempotency check — providers retry failed webhooks; skip already-processed IDs.
    const isNewEvent = await this.idempotency.checkAndMark(
      `billing:webhook:${provider.name}:${event.eventId}`,
      PROCESSED_EVENT_TTL_SECONDS,
    );
    if (!isNewEvent) {
      this.logger.warn(
        `Event ${event.eventId} already processed — skipping duplicate`,
      );
      return;
    }

    switch (event.type) {
      case 'subscription_created':
        await this.handleSubscriptionCreated(event);
        break;
      case 'subscription_updated':
        await this.handleSubscriptionUpdated(event);
        break;
      case 'subscription_cancelled':
        await this.handleSubscriptionCancelled(event);
        break;
      case 'payment_succeeded':
        await this.handlePaymentSucceeded(event);
        break;
      case 'payment_failed':
        await this.handlePaymentFailed(event);
        break;
      default:
        this.logger.debug(
          `Unhandled ${provider.name} event: ${event.providerEventName}`,
        );
    }
  }

  // ─── Event handlers ───────────────────────────────────────────────────────

  private async handleSubscriptionCreated(event: NormalizedPaymentEvent) {
    const { tenantId, plan = 'pro' } = event;

    if (!tenantId) {
      this.logger.warn(
        '[Billing] subscription_created: no tenant_id in custom_data',
      );
      return;
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: plan as any,
        status: 'active',
        paymentProvider: event.providerName,
        paymentCustomerId: event.customerId ?? null,
        paymentSubscriptionId: event.subscriptionId ?? null,
        subscriptionStatus: event.status ?? 'active',
        subscriptionCurrentPeriodEnd: event.currentPeriodEnd ?? null,
        gracePeriodEndsAt: null,
      },
    });

    this.logger.log(
      `[Billing] Subscription created: tenant=${tenantId} plan=${plan} sub=${event.subscriptionId}`,
    );
  }

  private async handleSubscriptionUpdated(event: NormalizedPaymentEvent) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { paymentSubscriptionId: event.subscriptionId },
      select: { id: true },
    });
    // Fallback to custom_data in case of race on first subscription event
    const tenantId = tenant?.id ?? event.tenantId;
    if (!tenantId) return;

    const plan: any = (event.plan ?? 'pro') as any;
    const status = event.status ?? 'active';

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan,
        subscriptionStatus: status,
        subscriptionCurrentPeriodEnd: event.currentPeriodEnd ?? null,
        ...(status === 'active'
          ? { gracePeriodEndsAt: null, status: 'active' }
          : {}),
      },
    });

    this.logger.log(
      `[Billing] Subscription updated: tenant=${tenantId} status=${status}`,
    );
  }

  private async handleSubscriptionCancelled(event: NormalizedPaymentEvent) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { paymentSubscriptionId: event.subscriptionId },
      select: { id: true },
    });
    const tenantId = tenant?.id ?? event.tenantId;
    if (!tenantId) return;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: 'free',
        status: 'active',
        subscriptionStatus: 'canceled',
        paymentSubscriptionId: null,
        gracePeriodEndsAt: null,
      },
    });

    this.logger.log(
      `[Billing] Subscription cancelled/expired: tenant=${tenantId} → downgraded to free`,
    );
  }

  private async handlePaymentSucceeded(event: NormalizedPaymentEvent) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { paymentSubscriptionId: event.subscriptionId },
      select: { id: true },
    });
    const tenantId = tenant?.id ?? event.tenantId;
    if (!tenantId) return;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'active',
        subscriptionStatus: 'active',
        gracePeriodEndsAt: null,
      },
    });

    this.logger.log(
      `[Billing] Payment succeeded: tenant=${tenantId} — reactivated`,
    );
  }

  private async handlePaymentFailed(event: NormalizedPaymentEvent) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { paymentSubscriptionId: event.subscriptionId },
      select: { id: true, subscriptionStatus: true },
    });
    const tenantId = tenant?.id ?? event.tenantId;
    if (!tenantId) return;

    const gracePeriodEndsAt = new Date();
    gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + GRACE_PERIOD_DAYS);

    if (tenant?.subscriptionStatus === 'past_due') {
      // Already past_due from a previous failure: suspend the account
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          status: 'suspended',
          subscriptionStatus: 'past_due',
          gracePeriodEndsAt,
        },
      });
      this.logger.warn(
        `[Billing] Repeated payment failure: tenant=${tenantId} → SUSPENDED (grace until ${gracePeriodEndsAt.toISOString()})`,
      );
    } else {
      // First failure: set grace period, keep active
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionStatus: 'past_due',
          gracePeriodEndsAt,
        },
      });
      this.logger.warn(
        `[Billing] Payment failed: tenant=${tenantId} → grace period set`,
      );
    }
  }

  // ─── Status & history ─────────────────────────────────────────────────────

  async getStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        plan: true,
        status: true,
        subscriptionStatus: true,
        subscriptionCurrentPeriodEnd: true,
        gracePeriodEndsAt: true,
      },
    });

    const now = new Date();
    const inGracePeriod = tenant?.gracePeriodEndsAt
      ? tenant.gracePeriodEndsAt > now
      : false;

    return {
      plan: tenant?.plan ?? 'free',
      status: tenant?.status ?? 'active',
      subscriptionStatus: tenant?.subscriptionStatus ?? null,
      currentPeriodEnd: tenant?.subscriptionCurrentPeriodEnd ?? null,
      inGracePeriod,
      gracePeriodEndsAt: inGracePeriod ? tenant?.gracePeriodEndsAt : null,
    };
  }
}
