import { BadRequestException } from '@nestjs/common';
import { PaymentProviderFactory } from './payment-provider.factory';
import { StripeProvider } from './providers/stripe/stripe.provider';
import { PaddleProvider } from './providers/paddle/paddle.provider';
import { FlutterwaveProvider } from './providers/flutterwave/flutterwave.provider';
import { PaystackProvider } from './providers/paystack/paystack.provider';

function buildFactory(env: Record<string, string | undefined> = {}) {
  const config = { get: jest.fn((key: string) => env[key]) } as any;
  return new PaymentProviderFactory(config);
}

describe('PaymentProviderFactory', () => {
  it('throws when no provider is configured and none is requested explicitly', () => {
    const factory = buildFactory();
    expect(() => factory.getProvider()).toThrow(BadRequestException);
  });

  it('selects the provider from PAYMENT_PROVIDER', () => {
    expect(
      buildFactory({ PAYMENT_PROVIDER: 'stripe' }).getProvider(),
    ).toBeInstanceOf(StripeProvider);
    expect(
      buildFactory({ PAYMENT_PROVIDER: 'paddle' }).getProvider(),
    ).toBeInstanceOf(PaddleProvider);
    expect(
      buildFactory({ PAYMENT_PROVIDER: 'flutterwave' }).getProvider(),
    ).toBeInstanceOf(FlutterwaveProvider);
    expect(
      buildFactory({ PAYMENT_PROVIDER: 'paystack' }).getProvider(),
    ).toBeInstanceOf(PaystackProvider);
  });

  it('throws for an unknown provider name instead of silently falling back', () => {
    const factory = buildFactory({ PAYMENT_PROVIDER: 'unknown' as any });
    expect(() => factory.getProvider()).toThrow(BadRequestException);
  });

  it('an explicit provider name argument overrides PAYMENT_PROVIDER', () => {
    const factory = buildFactory({ PAYMENT_PROVIDER: 'stripe' });
    expect(factory.getProvider('paddle')).toBeInstanceOf(PaddleProvider);
  });
});

describe('Placeholder providers', () => {
  const placeholders = [
    new StripeProvider(),
    new PaddleProvider(),
    new FlutterwaveProvider(),
    new PaystackProvider(),
  ];

  it.each(placeholders.map((p) => [p.name, p] as const))(
    '%s is never configured and rejects all operations',
    async (_name, provider) => {
      expect(provider.isConfigured()).toBe(false);
      expect(provider.verifyWebhookSignature(Buffer.from(''), '')).toBe(false);

      await expect(
        provider.createCheckoutSession({
          tenantId: 't',
          tenantName: 'Test',
          plan: 'pro',
          returnUrl: 'http://localhost',
        }),
      ).rejects.toThrow();

      expect(() => provider.parseWebhookEvent(Buffer.from('{}'))).toThrow();
    },
  );
});
