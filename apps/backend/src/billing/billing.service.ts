import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

const GRACE_PERIOD_DAYS = 3;

// In-memory idempotency store — prevents duplicate processing of Stripe retries.
// Stores (eventId → timestamp) pairs; evicted after 25 hours.
// For multi-instance deployments, replace with Redis (SETNX + TTL).
const PROCESSED_EVENT_TTL_MS = 25 * 60 * 60 * 1000; // 25h

@Injectable()
export class BillingService {
  private stripe: InstanceType<typeof Stripe> | null = null;
  private readonly logger = new Logger(BillingService.name);
  private readonly processedEvents = new Map<string, number>();

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key && !key.includes('REMPLACER') && !key.includes('REPLACE')) {
      this.stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
    } else {
      this.logger.warn('Stripe not configured — billing features disabled');
    }
  }

  // ─── Checkout ─────────────────────────────────────────────────────────────

  async createCheckoutSession(tenantId: string, plan: 'pro' | 'enterprise', returnUrl: string) {
    if (!this.stripe) throw new BadRequestException('Stripe non configuré');

    const priceId = plan === 'enterprise'
      ? this.config.get('STRIPE_ENTERPRISE_PRICE_ID')
      : this.config.get('STRIPE_PRO_PRICE_ID');

    if (!priceId) throw new BadRequestException(`Price ID for plan "${plan}" not configured`);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true, stripeCustomerId: true },
    });

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: tenant?.stripeCustomerId ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { tenantId, plan },
      success_url: `${returnUrl}/admin/billing?success=1`,
      cancel_url: `${returnUrl}/admin/billing?canceled=1`,
      client_reference_id: tenantId,
    });

    return { url: session.url };
  }

  // ─── Webhook handler ──────────────────────────────────────────────────────

  async handleWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) return;

    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';
    // Use the same type pattern as the original code — nodenext module resolution
    // resolves `Stripe` as `StripeConstructor`, not the namespace with sub-types.
    let event: ReturnType<InstanceType<typeof Stripe>['webhooks']['constructEvent']>;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (err) {
      this.logger.error('Webhook signature validation failed', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Stripe event received: ${event.type} (id=${event.id})`);

    // Idempotency check — Stripe may retry events; skip already-processed events.
    if (this.processedEvents.has(event.id)) {
      this.logger.warn(`Stripe event ${event.id} already processed — skipping duplicate`);
      return;
    }
    this.processedEvents.set(event.id, Date.now());
    // Evict stale entries to prevent unbounded memory growth
    this.evictStaleProcessedEvents();

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as any);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as any);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as any);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as any);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as any);
        break;

      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }

  // ─── Event handlers ───────────────────────────────────────────────────────

  private async handleCheckoutCompleted(session: any) {
    const tenantId = session.metadata?.tenantId ?? session.client_reference_id;
    const plan = session.metadata?.plan ?? 'pro';
    const customerId = session.customer as string | null;
    const subscriptionId = session.subscription as string | null;

    if (!tenantId) return;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: plan as any,
        status: 'active',
        stripeCustomerId: customerId ?? undefined,
        stripeSubscriptionId: subscriptionId ?? undefined,
        subscriptionStatus: 'active',
        gracePeriodEndsAt: null,
      },
    });

    this.logger.log(`[Billing] Checkout completed: tenant=${tenantId} plan=${plan}`);
  }

  private async handleSubscriptionUpdated(sub: any) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { stripeSubscriptionId: sub.id },
      select: { id: true },
    });
    if (!tenant) return;

    const plan = (sub.metadata?.plan ?? 'pro') as any;
    const periodEnd = new Date((sub.current_period_end ?? 0) * 1000);

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        plan,
        subscriptionStatus: sub.status,
        subscriptionCurrentPeriodEnd: periodEnd,
        // Clear grace period if subscription is now active
        ...(sub.status === 'active' ? { gracePeriodEndsAt: null, status: 'active' } : {}),
      },
    });

    this.logger.log(`[Billing] Subscription updated: tenant=${tenant.id} status=${sub.status} plan=${plan}`);
  }

  private async handleSubscriptionDeleted(sub: any) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { stripeSubscriptionId: sub.id },
      select: { id: true },
    });
    if (!tenant) return;

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        plan: 'free',
        status: 'active',
        subscriptionStatus: 'canceled',
        stripeSubscriptionId: null,
        gracePeriodEndsAt: null,
      },
    });

    this.logger.log(`[Billing] Subscription cancelled: tenant=${tenant.id} → downgraded to free`);
  }

  private async handlePaymentSucceeded(invoice: any) {
    if (!invoice.subscription) return;
    const tenant = await this.prisma.tenant.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string },
      select: { id: true },
    });
    if (!tenant) return;

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        status: 'active',
        subscriptionStatus: 'active',
        gracePeriodEndsAt: null,
      },
    });

    this.logger.log(`[Billing] Payment succeeded: tenant=${tenant.id} — reactivated`);
  }

  private async handlePaymentFailed(invoice: any) {
    if (!invoice.subscription) return;
    const tenant = await this.prisma.tenant.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string },
      select: { id: true, gracePeriodEndsAt: true },
    });
    if (!tenant) return;

    const gracePeriodEndsAt = new Date();
    gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + GRACE_PERIOD_DAYS);

    const attemptCount = (invoice as any).attempt_count ?? 1;

    if (attemptCount >= 3) {
      // After 3 failed attempts: suspend the account
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          status: 'suspended',
          subscriptionStatus: 'past_due',
          gracePeriodEndsAt,
        },
      });
      this.logger.warn(`[Billing] Payment failed ×${attemptCount}: tenant=${tenant.id} → SUSPENDED (grace until ${gracePeriodEndsAt.toISOString()})`);
    } else {
      // First/second failure: set grace period but keep active
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          subscriptionStatus: 'past_due',
          gracePeriodEndsAt,
        },
      });
      this.logger.warn(`[Billing] Payment failed ×${attemptCount}: tenant=${tenant.id} → grace period set`);
    }
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────

  private evictStaleProcessedEvents(): void {
    const cutoff = Date.now() - PROCESSED_EVENT_TTL_MS;
    for (const [id, ts] of this.processedEvents) {
      if (ts < cutoff) this.processedEvents.delete(id);
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
    const inGracePeriod = tenant?.gracePeriodEndsAt ? tenant.gracePeriodEndsAt > now : false;

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
