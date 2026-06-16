import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentProvider,
  PaymentProviderName,
} from './interfaces/payment-provider.interface';
import { LemonSqueezyProvider } from './providers/lemonsqueezy/lemonsqueezy.provider';
import { StripeProvider } from './providers/stripe/stripe.provider';
import { PaddleProvider } from './providers/paddle/paddle.provider';
import { FlutterwaveProvider } from './providers/flutterwave/flutterwave.provider';
import { PaystackProvider } from './providers/paystack/paystack.provider';

const DEFAULT_PROVIDER: PaymentProviderName = 'lemonsqueezy';

/**
 * Sélectionne le fournisseur de paiement actif via la variable
 * d'environnement PAYMENT_PROVIDER (défaut : "lemonsqueezy", seul
 * fournisseur réellement implémenté à ce jour). Les autres fournisseurs
 * sont des placeholders qui lèvent une erreur explicite s'ils sont
 * sélectionnés sans être implémentés.
 */
@Injectable()
export class PaymentProviderFactory {
  private readonly providers: Record<PaymentProviderName, PaymentProvider>;

  constructor(private readonly config: ConfigService) {
    this.providers = {
      lemonsqueezy: new LemonSqueezyProvider(this.config),
      stripe: new StripeProvider(),
      paddle: new PaddleProvider(),
      flutterwave: new FlutterwaveProvider(),
      paystack: new PaystackProvider(),
    };
  }

  getProvider(name?: PaymentProviderName): PaymentProvider {
    const selected =
      name ??
      (this.config.get<string>('PAYMENT_PROVIDER') as
        | PaymentProviderName
        | undefined) ??
      DEFAULT_PROVIDER;

    return this.providers[selected] ?? this.providers[DEFAULT_PROVIDER];
  }
}
