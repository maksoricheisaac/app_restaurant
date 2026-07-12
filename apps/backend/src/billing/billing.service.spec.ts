import { BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PaymentProviderFactory } from '../payments/payment-provider.factory';
import {
  NormalizedPaymentEvent,
  PaymentProvider,
  PaymentProviderName,
} from '../payments/interfaces/payment-provider.interface';
import { IdempotencyService } from '../common/redis/idempotency.service';
import { RedisService } from '../common/redis/redis.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

/**
 * BillingService doit rester totalement agnostique du fournisseur de
 * paiement actif — ces tests l'exercent via un FakePaymentProvider plutôt
 * que via un SDK concret, pour ne pas dépendre d'un fournisseur en
 * particulier (aucun n'est implémenté à ce jour, voir apps/backend/src/payments).
 */
class FakePaymentProvider implements PaymentProvider {
  readonly name: PaymentProviderName = 'stripe';
  configured = true;
  validSignature = true;
  checkoutUrl = 'https://pay.example.com/checkout/xxx';
  nextEvent: NormalizedPaymentEvent = {
    type: 'unhandled',
    eventId: 'evt-1',
    providerEventName: 'unhandled',
  };

  isConfigured(): boolean {
    return this.configured;
  }

  createCheckoutSession() {
    if (!this.configured) {
      throw new BadRequestException('not configured');
    }
    return Promise.resolve({ url: this.checkoutUrl });
  }

  verifyWebhookSignature(): boolean {
    return this.validSignature;
  }

  parseWebhookEvent(): NormalizedPaymentEvent {
    return this.nextEvent;
  }
}

describe('BillingService', () => {
  let service: BillingService;
  let prisma: MockPrisma;
  let fakeProvider: FakePaymentProvider;

  beforeEach(() => {
    prisma = createMockPrisma();
    fakeProvider = new FakePaymentProvider();
    const paymentProviders = {
      getProvider: () => fakeProvider,
    } as unknown as PaymentProviderFactory;
    const redisService = { getClient: () => null } as unknown as RedisService;
    const idempotency = new IdempotencyService(redisService);
    // Plan payant valide par défaut (assertSubscribable OK, prix > 0).
    const plans = {
      assertSubscribable: jest.fn(async (key: string) => ({
        key,
        monthlyPrice: 29,
        isActive: true,
      })),
    };
    service = new BillingService(
      prisma as any,
      paymentProviders,
      idempotency,
      plans as any,
    );
  });

  // ─── getStatus ────────────────────────────────────────────────────────

  describe('getStatus', () => {
    it('returns plan and subscription status', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'pro',
        status: 'active',
        subscriptionStatus: 'active',
        subscriptionCurrentPeriodEnd: new Date('2026-06-01'),
        gracePeriodEndsAt: null,
      });

      const result = await service.getStatus('tenant-1');

      expect(result.plan).toBe('pro');
      expect(result.status).toBe('active');
      expect(result.subscriptionStatus).toBe('active');
      expect(result.inGracePeriod).toBe(false);
    });

    it('reports grace period correctly', async () => {
      const gracePeriodEndsAt = new Date(Date.now() + 2 * 24 * 3600 * 1000);
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'pro',
        status: 'suspended',
        subscriptionStatus: 'past_due',
        subscriptionCurrentPeriodEnd: null,
        gracePeriodEndsAt,
      });

      const result = await service.getStatus('tenant-1');

      expect(result.inGracePeriod).toBe(true);
      expect(result.gracePeriodEndsAt).toEqual(gracePeriodEndsAt);
    });

    it('reports no grace period when gracePeriodEndsAt is in the past', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'free',
        status: 'active',
        subscriptionStatus: null,
        subscriptionCurrentPeriodEnd: null,
        gracePeriodEndsAt: new Date(Date.now() - 1000),
      });

      const result = await service.getStatus('tenant-1');
      expect(result.inGracePeriod).toBe(false);
      expect(result.gracePeriodEndsAt).toBeNull();
    });
  });

  // ─── createCheckoutSession ────────────────────────────────────────────

  describe('createCheckoutSession', () => {
    it('returns the checkout URL from the active provider', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        name: 'Test',
      });

      const result = await service.createCheckoutSession(
        'tenant-1',
        'pro',
        'http://localhost:4000',
      );

      expect(result).toEqual({ url: fakeProvider.checkoutUrl });
    });

    it('rejects when the active provider is not configured', async () => {
      fakeProvider.configured = false;
      prisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        name: 'Test',
      });

      await expect(
        service.createCheckoutSession(
          'tenant-1',
          'pro',
          'http://localhost:4000',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when the tenant does not exist', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.createCheckoutSession(
          'missing',
          'pro',
          'http://localhost:4000',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ─── handleWebhook — signature validation ────────────────────────────

  describe('handleWebhook — signature validation', () => {
    it('rejects an invalid signature', async () => {
      fakeProvider.validSignature = false;
      await expect(
        service.handleWebhook(Buffer.from('{}'), 'bad-sig'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('processes the event when the signature is valid', async () => {
      fakeProvider.nextEvent = {
        type: 'unhandled',
        eventId: 'evt-ok',
        providerEventName: 'noop',
      };
      await expect(
        service.handleWebhook(Buffer.from('{}'), 'good-sig'),
      ).resolves.not.toThrow();
    });
  });

  // ─── handleWebhook — idempotency ─────────────────────────────────────

  describe('handleWebhook — idempotency', () => {
    it('skips duplicate webhook delivery (same eventId)', async () => {
      prisma.tenant.update.mockResolvedValue({});
      fakeProvider.nextEvent = {
        type: 'subscription_created',
        eventId: 'evt-dup',
        providerEventName: 'subscription_created',
        tenantId: 'tenant-1',
        plan: 'pro',
        customerId: '100',
        subscriptionId: '42',
        status: 'active',
      };

      await service.handleWebhook(Buffer.from('{}'), 'sig');
      await service.handleWebhook(Buffer.from('{}'), 'sig'); // same eventId

      expect(prisma.tenant.update).toHaveBeenCalledTimes(1);
    });
  });

  // ─── subscription_created ─────────────────────────────────────────────

  describe('handleWebhook — subscription_created', () => {
    it('activates the plan and stores generic payment provider IDs', async () => {
      prisma.tenant.update.mockResolvedValue({});
      fakeProvider.nextEvent = {
        type: 'subscription_created',
        eventId: 'evt-1',
        providerEventName: 'subscription_created',
        tenantId: 'tenant-1',
        plan: 'pro',
        customerId: '100',
        subscriptionId: '42',
        status: 'active',
      };

      await service.handleWebhook(Buffer.from('{}'), 'sig');

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: expect.objectContaining({
          plan: 'pro',
          status: 'active',
          paymentProvider: 'stripe',
          paymentCustomerId: '100',
          paymentSubscriptionId: '42',
          subscriptionStatus: 'active',
          gracePeriodEndsAt: null,
        }),
      });
    });

    it('ignores event with no tenantId', async () => {
      fakeProvider.nextEvent = {
        type: 'subscription_created',
        eventId: 'evt-2',
        providerEventName: 'subscription_created',
        customerId: '100',
        status: 'active',
      };

      await service.handleWebhook(Buffer.from('{}'), 'sig');

      expect(prisma.tenant.update).not.toHaveBeenCalled();
    });
  });

  // ─── subscription_updated ─────────────────────────────────────────────

  describe('handleWebhook — subscription_updated', () => {
    it('updates plan and clears grace period when status is active', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1' });
      prisma.tenant.update.mockResolvedValue({});
      fakeProvider.nextEvent = {
        type: 'subscription_updated',
        eventId: 'evt-3',
        providerEventName: 'subscription_updated',
        tenantId: 'tenant-1',
        plan: 'pro',
        subscriptionId: '42',
        status: 'active',
      };

      await service.handleWebhook(Buffer.from('{}'), 'sig');

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: expect.objectContaining({
          subscriptionStatus: 'active',
          gracePeriodEndsAt: null,
          status: 'active',
        }),
      });
    });
  });

  // ─── subscription_cancelled ───────────────────────────────────────────

  describe('handleWebhook — subscription_cancelled', () => {
    it('downgrades tenant to free plan on cancellation', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1' });
      prisma.tenant.update.mockResolvedValue({});
      fakeProvider.nextEvent = {
        type: 'subscription_cancelled',
        eventId: 'evt-4',
        providerEventName: 'subscription_cancelled',
        tenantId: 'tenant-1',
        subscriptionId: '42',
        status: 'cancelled',
      };

      await service.handleWebhook(Buffer.from('{}'), 'sig');

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: expect.objectContaining({
          plan: 'free',
          status: 'active',
          subscriptionStatus: 'canceled',
          paymentSubscriptionId: null,
        }),
      });
    });
  });

  // ─── payment_succeeded ────────────────────────────────────────────────

  describe('handleWebhook — payment_succeeded', () => {
    it('reactivates tenant and clears grace period', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1' });
      prisma.tenant.update.mockResolvedValue({});
      fakeProvider.nextEvent = {
        type: 'payment_succeeded',
        eventId: 'evt-5',
        providerEventName: 'payment_succeeded',
        tenantId: 'tenant-1',
        subscriptionId: '42',
      };

      await service.handleWebhook(Buffer.from('{}'), 'sig');

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: expect.objectContaining({
          status: 'active',
          subscriptionStatus: 'active',
          gracePeriodEndsAt: null,
        }),
      });
    });
  });

  // ─── payment_failed ───────────────────────────────────────────────────

  describe('handleWebhook — payment_failed', () => {
    it('sets grace period on first failure (status was active)', async () => {
      prisma.tenant.findFirst.mockResolvedValue({
        id: 'tenant-1',
        subscriptionStatus: 'active',
      });
      prisma.tenant.update.mockResolvedValue({});
      fakeProvider.nextEvent = {
        type: 'payment_failed',
        eventId: 'evt-6',
        providerEventName: 'payment_failed',
        tenantId: 'tenant-1',
        subscriptionId: '42',
      };

      await service.handleWebhook(Buffer.from('{}'), 'sig');

      const call = prisma.tenant.update.mock.calls[0][0];
      expect(call.data.subscriptionStatus).toBe('past_due');
      expect(call.data.gracePeriodEndsAt).toBeInstanceOf(Date);
      expect(call.data.status).toBeUndefined(); // NOT suspended yet
    });

    it('suspends tenant on repeated failure (status was already past_due)', async () => {
      prisma.tenant.findFirst.mockResolvedValue({
        id: 'tenant-1',
        subscriptionStatus: 'past_due',
      });
      prisma.tenant.update.mockResolvedValue({});
      fakeProvider.nextEvent = {
        type: 'payment_failed',
        eventId: 'evt-7',
        providerEventName: 'payment_failed',
        tenantId: 'tenant-1',
        subscriptionId: '42',
      };

      await service.handleWebhook(Buffer.from('{}'), 'sig');

      const call = prisma.tenant.update.mock.calls[0][0];
      expect(call.data.status).toBe('suspended');
    });
  });
});
