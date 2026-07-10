import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ConfigService } from '@nestjs/config';

const mockBillingService = {
  createCheckoutSession: jest.fn(),
  getStatus: jest.fn(),
  handleWebhook: jest.fn(),
};

const mockConfig = {
  get: jest.fn().mockImplementation((key: string) => {
    if (key === 'FRONTEND_URL') return 'http://localhost:4000';
    return undefined;
  }),
};

const mockTenant = { id: 'tenant-1', name: 'Test Restaurant' };

describe('BillingController', () => {
  let controller: BillingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        { provide: BillingService, useValue: mockBillingService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BillingController>(BillingController);
    jest.clearAllMocks();
  });

  // ─── createCheckout ──────────────────────────────────────────────────────

  describe('createCheckout', () => {
    it('creates a checkout for pro plan', async () => {
      mockBillingService.createCheckoutSession.mockResolvedValue({
        url: 'https://pay.example.com/checkout/buy/pro123',
      });

      const result = await controller.createCheckout(mockTenant as any, 'pro');

      expect(mockBillingService.createCheckoutSession).toHaveBeenCalledWith(
        'tenant-1',
        'pro',
        'http://localhost:4000',
      );
      expect(result).toEqual({
        url: 'https://pay.example.com/checkout/buy/pro123',
      });
    });

    it('defaults to pro plan when plan is not specified', async () => {
      mockBillingService.createCheckoutSession.mockResolvedValue({
        url: 'https://pay.example.com/checkout/x',
      });
      await controller.createCheckout(mockTenant as any, undefined as any);
      expect(mockBillingService.createCheckoutSession).toHaveBeenCalledWith(
        'tenant-1',
        'pro',
        expect.any(String),
      );
    });

    it('creates a checkout for enterprise plan', async () => {
      mockBillingService.createCheckoutSession.mockResolvedValue({
        url: 'https://pay.example.com/checkout/e',
      });
      await controller.createCheckout(mockTenant as any, 'enterprise');
      expect(mockBillingService.createCheckoutSession).toHaveBeenCalledWith(
        'tenant-1',
        'enterprise',
        expect.any(String),
      );
    });
  });

  // ─── getStatus ───────────────────────────────────────────────────────────

  describe('getStatus', () => {
    it('returns the subscription status for the tenant', async () => {
      const status = {
        plan: 'pro',
        status: 'active',
        subscriptionStatus: 'active',
        currentPeriodEnd: new Date('2026-12-31'),
        inGracePeriod: false,
        gracePeriodEndsAt: null,
      };
      mockBillingService.getStatus.mockResolvedValue(status);

      const result = await controller.getStatus(mockTenant as any);

      expect(mockBillingService.getStatus).toHaveBeenCalledWith('tenant-1');
      expect(result).toBe(status);
    });
  });

  // ─── handleWebhook ───────────────────────────────────────────────────────

  describe('handleWebhook', () => {
    it('processes a valid webhook (X-Signature header)', async () => {
      mockBillingService.handleWebhook.mockResolvedValue(undefined);
      const rawBody = Buffer.from(
        '{"meta":{"event_name":"subscription_created"}}',
      );
      const req: any = { rawBody };

      const result = await controller.handleWebhook(req, 'provider_sig_abc123');

      expect(mockBillingService.handleWebhook).toHaveBeenCalledWith(
        rawBody,
        'provider_sig_abc123',
      );
      expect(result).toEqual({ received: true });
    });

    it('propagates BadRequestException on invalid signature', async () => {
      mockBillingService.handleWebhook.mockRejectedValue(
        new BadRequestException('Invalid webhook signature'),
      );
      const req: any = { rawBody: Buffer.from('') };
      await expect(controller.handleWebhook(req, 'bad_sig')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
