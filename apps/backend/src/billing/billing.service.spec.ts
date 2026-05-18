import { BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const mockConfig = {
  get: jest.fn().mockImplementation((key: string) => {
    const cfg: Record<string, string> = {
      STRIPE_SECRET_KEY: 'sk_test_valid_key',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      STRIPE_PRO_PRICE_ID: 'price_pro',
      STRIPE_ENTERPRISE_PRICE_ID: 'price_enterprise',
      FRONTEND_URL: 'http://localhost:4000',
    };
    return cfg[key];
  }),
};

// Mock Stripe entirely — no network calls in tests
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }),
      },
    },
  }));
});

describe('BillingService', () => {
  let service: BillingService;
  let prisma: MockPrisma;
  let stripeInstance: any;

  beforeEach(async () => {
    prisma = createMockPrisma();
    service = new BillingService(mockConfig as any, prisma as any);
    // Access the private stripe instance via the service
    stripeInstance = (service as any).stripe;
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

      const status = await service.getStatus('tenant-1');

      expect(status.plan).toBe('pro');
      expect(status.status).toBe('active');
      expect(status.subscriptionStatus).toBe('active');
      expect(status.inGracePeriod).toBe(false);
    });

    it('reports grace period correctly', async () => {
      const gracePeriodEndsAt = new Date(Date.now() + 2 * 24 * 3600 * 1000); // 2 days from now
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'pro',
        status: 'suspended',
        subscriptionStatus: 'past_due',
        subscriptionCurrentPeriodEnd: null,
        gracePeriodEndsAt,
      });

      const status = await service.getStatus('tenant-1');

      expect(status.inGracePeriod).toBe(true);
      expect(status.gracePeriodEndsAt).toEqual(gracePeriodEndsAt);
    });

    it('reports no grace period when gracePeriodEndsAt is in the past', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'free',
        status: 'active',
        subscriptionStatus: null,
        subscriptionCurrentPeriodEnd: null,
        gracePeriodEndsAt: new Date(Date.now() - 1000), // expired
      });

      const status = await service.getStatus('tenant-1');
      expect(status.inGracePeriod).toBe(false);
      expect(status.gracePeriodEndsAt).toBeNull();
    });
  });

  // ─── handleWebhook — subscription.deleted (cancellation) ─────────────

  describe('handleWebhook — customer.subscription.deleted', () => {
    it('downgrades tenant to free plan on cancellation', async () => {
      const sub = {
        id: 'sub_123',
        metadata: { tenantId: 'tenant-1' },
        status: 'canceled',
      };

      stripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: { object: sub },
      });
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1' });
      prisma.tenant.update.mockResolvedValue({});

      await service.handleWebhook(Buffer.from('payload'), 'sig');

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: expect.objectContaining({
          plan: 'free',
          subscriptionStatus: 'canceled',
          stripeSubscriptionId: null,
        }),
      });
    });
  });

  // ─── handleWebhook — invoice.payment_failed (suspension) ─────────────

  describe('handleWebhook — invoice.payment_failed', () => {
    it('sets grace period on first payment failure', async () => {
      const invoice = {
        subscription: 'sub_123',
        attempt_count: 1,
      };
      stripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'invoice.payment_failed',
        data: { object: invoice },
      });
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1', gracePeriodEndsAt: null });
      prisma.tenant.update.mockResolvedValue({});

      await service.handleWebhook(Buffer.from('payload'), 'sig');

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: expect.objectContaining({
          subscriptionStatus: 'past_due',
          gracePeriodEndsAt: expect.any(Date),
        }),
      });

      // Should NOT suspend on first failure
      const call = prisma.tenant.update.mock.calls[0][0];
      expect(call.data.status).toBeUndefined();
    });

    it('suspends tenant after 3 failed payment attempts', async () => {
      const invoice = {
        subscription: 'sub_123',
        attempt_count: 3,
      };
      stripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'invoice.payment_failed',
        data: { object: invoice },
      });
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1', gracePeriodEndsAt: null });
      prisma.tenant.update.mockResolvedValue({});

      await service.handleWebhook(Buffer.from('payload'), 'sig');

      const call = prisma.tenant.update.mock.calls[0][0];
      expect(call.data.status).toBe('suspended');
    });
  });

  // ─── handleWebhook — invoice.payment_succeeded (reactivation) ────────

  describe('handleWebhook — invoice.payment_succeeded', () => {
    it('reactivates tenant after successful payment', async () => {
      const invoice = { subscription: 'sub_123' };
      stripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'invoice.payment_succeeded',
        data: { object: invoice },
      });
      prisma.tenant.findFirst.mockResolvedValue({ id: 'tenant-1' });
      prisma.tenant.update.mockResolvedValue({});

      await service.handleWebhook(Buffer.from('payload'), 'sig');

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

  // ─── handleWebhook — invalid signature ───────────────────────────────

  describe('handleWebhook — security', () => {
    it('throws BadRequestException on invalid webhook signature', async () => {
      stripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(service.handleWebhook(Buffer.from('payload'), 'bad_sig'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
