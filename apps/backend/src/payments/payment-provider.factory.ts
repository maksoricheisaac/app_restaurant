import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentProvider,
  PaymentProviderName,
} from './interfaces/payment-provider.interface';
import { StripeProvider } from './providers/stripe/stripe.provider';
import { PaddleProvider } from './providers/paddle/paddle.provider';
import { FlutterwaveProvider } from './providers/flutterwave/flutterwave.provider';
import { PaystackProvider } from './providers/paystack/paystack.provider';

/**
 * Sélectionne le fournisseur de paiement actif via la variable
 * d'environnement PAYMENT_PROVIDER. Aucun fournisseur n'est réellement
 * implémenté à ce jour (tous sont des placeholders inertes — voir
 * providers/*) : il n'y a donc volontairement pas de valeur par défaut qui
 * ferait silencieusement passer une requête à travers un provider inactif.
 * Si aucun provider n'est explicitement configuré, getProvider() échoue
 * avec un message clair plutôt que de retomber sur un choix arbitraire.
 */
@Injectable()
export class PaymentProviderFactory {
  private readonly providers: Record<PaymentProviderName, PaymentProvider>;

  constructor(private readonly config: ConfigService) {
    this.providers = {
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
        | undefined);

    if (!selected) {
      throw new BadRequestException(
        "Aucun fournisseur de paiement n'est configuré (variable PAYMENT_PROVIDER manquante)",
      );
    }

    const provider = this.providers[selected];
    if (!provider) {
      throw new BadRequestException(
        `Fournisseur de paiement inconnu : "${selected}"`,
      );
    }

    return provider;
  }
}
