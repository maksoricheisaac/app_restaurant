import { Injectable, BadRequestException } from '@nestjs/common';
import {
  CheckoutSessionParams,
  CheckoutSessionResult,
  NormalizedPaymentEvent,
  PaymentProvider,
  PaymentProviderName,
} from '../../interfaces/payment-provider.interface';

/**
 * Placeholder pour le fournisseur de paiement Flutterwave.
 *
 * Non implémenté intentionnellement : aucune clé Flutterwave réelle, aucun
 * SDK Flutterwave, aucun appel réseau. Ce provider existe pour documenter le
 * contrat à respecter (PaymentProvider) lorsque l'intégration Flutterwave
 * sera ajoutée, et pour permettre à PaymentProviderFactory de le sélectionner
 * sans modifier l'architecture.
 */
@Injectable()
export class FlutterwaveProvider implements PaymentProvider {
  readonly name: PaymentProviderName = 'flutterwave';

  isConfigured(): boolean {
    return false;
  }

  async createCheckoutSession(
    _params: CheckoutSessionParams,
  ): Promise<CheckoutSessionResult> {
    throw new BadRequestException(
      'Le fournisseur de paiement Flutterwave n\'est pas encore disponible',
    );
  }

  verifyWebhookSignature(_payload: Buffer, _signature: string): boolean {
    return false;
  }

  parseWebhookEvent(_payload: Buffer): NormalizedPaymentEvent {
    throw new BadRequestException(
      'Le fournisseur de paiement Flutterwave n\'est pas encore disponible',
    );
  }
}
