import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { BillingService } from './billing.service';
import { PaymentProviderFactory } from '../payments/payment-provider.factory';
import { IdempotencyService } from '../common/redis/idempotency.service';
import { RedisService } from '../common/redis/redis.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

// ─── Mock Lemon Squeezy SDK ───────────────────────────────────────────────

jest.mock('@lemonsqueezy/lemonsqueezy.js', () => ({
  lemonSqueezySetup: jest.fn(),
  createCheckout: jest.fn(),
}));

import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';

// ─── Mock config ──────────────────────────────────────────────────────────

const WEBHOOK_SECRET = 'test-webhook-secret-32chars-long!!';

const mockConfig = {
  get: jest.fn().mockImplementation((key: string) => {
    const cfg: Record<string, string> = {
      LEMON_SQUEEZY_API_KEY: 'test_live_key',
      LEMON_SQUEEZY_WEBHOOK_SECRET: WEBHOOK_SECRET,
      LEMON_SQUEEZY_STORE_ID: '1',
      LEMON_SQUEEZY_PRO_VARIANT_ID: '100',
      LEMON_SQUEEZY_ENTERPRISE_VARIANT_ID: '101',
      FRONTEND_URL: 'http://localhost:4000',
    };
    return cfg[key];
  }),
};

// ─── Payload helpers ──────────────────────────────────────────────────────

let _wid = 0;

function makePayload(
  eventName: string,
  data: Record<string, unknown>,
  customData: Record<string, string> = {},
): Buffer {
  return Buffer.from(
    JSON.stringify({
      meta: {
        event_name: eventName,
        webhook_id: `wh-${eventName}-${++_wid}`,
        custom_data: customData,
      },
      data,
    }),
    'utf8',
  );
}

function sign(payload: Buffer, secret = WEBHOOK_SECRET): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// ─── Suite ────────────────────────────────────────────────────────────────

describe('BillingService', () => {
  let service: BillingService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    const paymentProviders = new PaymentProviderFactory(mockConfig as any);
    const redisService = { getClient: () => null } as unknown as RedisService;
    const idempotency = new IdempotencyService(redisService);
    service = new BillingService(prisma as any, paymentProviders, idempotency);
    jest.clearAllMocks();
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
    it('returns a checkout URL for pro plan', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        name: 'Test',
      });
      (createCheckout as jest.Mock).mockResolvedValue({
        data: {
          data: {
            attributes: { url: 'https://checkout.lemonsqueezy.com/buy/xxx' },
          },
        },
        error: null,
      });

      const result = await service.createCheckoutSession(
        'tenant-1',
        'pro',
        'http://localhost:4000',
      );

      expect(result).toEqual({
        url: 'https://checkout.lemonsqueezy.com/buy/xxx',
      });
      expect(createCheckout).toHaveBeenCalledWith(
        1, // storeId as number
        100, // pro variantId as number
        expect.objectContaining({
          checkoutData: expect.objectContaining({
            custom: { tenant_id: 'tenant-1', plan: 'pro' },
          }),
        }),
      );
    });

    it('uses enterprise variant for enterprise plan', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        name: 'Test',
      });
      (createCheckout as jest.Mock).mockResolvedValue({
        data: {
          data: {
            attributes: { url: 'https://checkout.lemonsqueezy.com/buy/yyy' },
          },
        },
        error: null,
      });

      await service.createCheckoutSession(
        'tenant-1',
        'enterprise',
        'http://localhost:4000',
      );

      expect(createCheckout).toHaveBeenCalledWith(1, 101, expect.anything());
    });

    it('throws when Lemon Squeezy returns an error', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        name: 'Test',
      });
      (createCheckout as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('LS API error'),
      });

      await expect(
        service.createCheckoutSession(
          'tenant-1',
          'pro',
          'http://localhost:4000',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ─── handleWebhook — signature validation ────────────────────────────

  describe('handleWebhook — signature validation', () => {
    it('accepts a valid HMAC-SHA256 signature', async () => {
      const payload = makePayload('order_created', { id: '1', attributes: {} });
      await expect(
        service.handleWebhook(payload, sign(payload)),
      ).resolves.not.toThrow();
    });

    it('rejects an incorrect signature', async () => {
      const payload = makePayload('order_created', { id: '1', attributes: {} });
      await expect(
        service.handleWebhook(payload, 'a'.repeat(64)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a missing (empty) signature', async () => {
      const payload = makePayload('order_created', { id: '1', attributes: {} });
      await expect(service.handleWebhook(payload, '')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  // ─── handleWebhook — idempotency ─────────────────────────────────────

  describe('handleWebhook — idempotency', () => {
    it('skips duplicate webhook delivery (same webhook_id)', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1' });
      prisma.tenant.update.mockResolvedValue({});

      const body = JSON.parse(
        makePayload(
          'subscription_created',
          {
            id: '42',
            attributes: {
              customer_id: 100,
              status: 'active',
              renews_at: '2026-07-01T00:00:00Z',
            },
          },
          { tenant_id: 'tenant-1', plan: 'pro' },
        ).toString(),
      );
      const fixed = Buffer.from(JSON.stringify(body), 'utf8');
      const sig = sign(fixed);

      await service.handleWebhook(fixed, sig);
      await service.handleWebhook(fixed, sig); // second delivery — same webhook_id

      expect(prisma.tenant.update).toHaveBeenCalledTimes(1);
    });
  });

  // ─── subscription_created ─────────────────────────────────────────────

  describe('handleWebhook — subscription_created', () => {
    it('activates plan and stores Lemon Squeezy IDs', async () => {
      prisma.tenant.update.mockResolvedValue({});

      const payload = makePayload(
        'subscription_created',
        {
          id: '42',
          attributes: {
            customer_id: 100,
            status: 'active',
            renews_at: '2026-07-01T00:00:00Z',
          },
        },
        { tenant_id: 'tenant-1', plan: 'pro' },
      );

      await service.handleWebhook(payload, sign(payload));

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: expect.objectContaining({
          plan: 'pro',
          status: 'active',
          lemonSqueezyCustomerId: '100',
          lemonSqueezySubscriptionId: '42',
          subscriptionStatus: 'active',
          gracePeriodEndsAt: null,
        }),
      });
    });

    it('ignores event with no tenant_id in custom_data', async () => {
      const payload = makePayload(
        'subscription_created',
        { id: '42', attributes: { customer_id: 100, status: 'active' } },
        {}, // no tenant_id
      );

      await service.handleWebhook(payload, sign(payload));

      expect(prisma.tenant.update).not.toHaveBeenCalled();
    });
  });

  // ─── subscription_updated ─────────────────────────────────────────────

  describe('handleWebhook — subscription_updated', () => {
    it('updates plan and clears grace period when status is active', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1' });
      prisma.tenant.update.mockResolvedValue({});

      const payload = makePayload(
        'subscription_updated',
        {
          id: '42',
          attributes: { status: 'active', renews_at: '2026-08-01T00:00:00Z' },
        },
        { tenant_id: 'tenant-1', plan: 'pro' },
      );

      await service.handleWebhook(payload, sign(payload));

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

      const payload = makePayload(
        'subscription_cancelled',
        { id: '42', attributes: { status: 'cancelled' } },
        { tenant_id: 'tenant-1', plan: 'pro' },
      );

      await service.handleWebhook(payload, sign(payload));

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: expect.objectContaining({
          plan: 'free',
          status: 'active',
          subscriptionStatus: 'canceled',
          lemonSqueezySubscriptionId: null,
        }),
      });
    });

    it('also handles subscription_expired the same way', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1' });
      prisma.tenant.update.mockResolvedValue({});

      const payload = makePayload(
        'subscription_expired',
        { id: '42', attributes: { status: 'expired' } },
        { tenant_id: 'tenant-1', plan: 'pro' },
      );

      await service.handleWebhook(payload, sign(payload));

      const call = prisma.tenant.update.mock.calls[0][0];
      expect(call.data.plan).toBe('free');
    });
  });

  // ─── subscription_payment_success ────────────────────────────────────

  describe('handleWebhook — subscription_payment_success', () => {
    it('reactivates tenant and clears grace period', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1' });
      prisma.tenant.update.mockResolvedValue({});

      const payload = makePayload(
        'subscription_payment_success',
        { id: 'inv-1', attributes: { subscription_id: 42 } },
        { tenant_id: 'tenant-1', plan: 'pro' },
      );

      await service.handleWebhook(payload, sign(payload));

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

  // ─── subscription_payment_failed ─────────────────────────────────────

  describe('handleWebhook — subscription_payment_failed', () => {
    it('sets grace period on first failure (status was active)', async () => {
      prisma.tenant.findFirst.mockResolvedValue({
        id: 'tenant-1',
        subscriptionStatus: 'active',
      });
      prisma.tenant.update.mockResolvedValue({});

      const payload = makePayload(
        'subscription_payment_failed',
        { id: 'inv-1', attributes: { subscription_id: 42 } },
        { tenant_id: 'tenant-1', plan: 'pro' },
      );

      await service.handleWebhook(payload, sign(payload));

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

      const payload = makePayload(
        'subscription_payment_failed',
        { id: 'inv-2', attributes: { subscription_id: 42 } },
        { tenant_id: 'tenant-1', plan: 'pro' },
      );

      await service.handleWebhook(payload, sign(payload));

      const call = prisma.tenant.update.mock.calls[0][0];
      expect(call.data.status).toBe('suspended');
    });
  });
});
