import { PaymentProviderFactory } from './payment-provider.factory';
import { LemonSqueezyProvider } from './providers/lemonsqueezy/lemonsqueezy.provider';
import { StripeProvider } from './providers/stripe/stripe.provider';
import { PaddleProvider } from './providers/paddle/paddle.provider';
import { FlutterwaveProvider } from './providers/flutterwave/flutterwave.provider';
import { PaystackProvider } from './providers/paystack/paystack.provider';

jest.mock('@lemonsqueezy/lemonsqueezy.js', () => ({
  lemonSqueezySetup: jest.fn(),
  createCheckout: jest.fn(),
}));

function buildFactory(env: Record<string, string | undefined> = {}) {
  const config = { get: jest.fn((key: string) => env[key]) } as any;
  return new PaymentProviderFactory(config);
}

describe('PaymentProviderFactory', () => {
  it('defaults to lemonsqueezy when PAYMENT_PROVIDER is not set', () => {
    const factory = buildFactory();
    expect(factory.getProvider()).toBeInstanceOf(LemonSqueezyProvider);
  });

  it('selects the provider from PAYMENT_PROVIDER', () => {
    expect(buildFactory({ PAYMENT_PROVIDER: 'stripe' }).getProvider()).toBeInstanceOf(
      StripeProvider,
    );
    expect(buildFactory({ PAYMENT_PROVIDER: 'paddle' }).getProvider()).toBeInstanceOf(
      PaddleProvider,
    );
    expect(
      buildFactory({ PAYMENT_PROVIDER: 'flutterwave' }).getProvider(),
    ).toBeInstanceOf(FlutterwaveProvider);
    expect(
      buildFactory({ PAYMENT_PROVIDER: 'paystack' }).getProvider(),
    ).toBeInstanceOf(PaystackProvider);
  });

  it('falls back to lemonsqueezy for an unknown provider name', () => {
    const factory = buildFactory({ PAYMENT_PROVIDER: 'unknown' as any });
    expect(factory.getProvider()).toBeInstanceOf(LemonSqueezyProvider);
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
