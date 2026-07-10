import { Injectable, BadRequestException } from '@nestjs/common';
import {
  CheckoutSessionParams,
  CheckoutSessionResult,
  NormalizedPaymentEvent,
  PaymentProvider,
  PaymentProviderName,
} from '../../interfaces/payment-provider.interface';

/**
 * Placeholder pour le fournisseur de paiement Paddle.
 *
 * Non implémenté intentionnellement : aucune clé Paddle réelle, aucun SDK
 * Paddle, aucun appel réseau. Ce provider existe pour documenter le contrat
 * à respecter (PaymentProvider) lorsque l'intégration Paddle sera ajoutée,
 * et pour permettre à PaymentProviderFactory de le sélectionner sans
 * modifier l'architecture.
 */
@Injectable()
export class PaddleProvider implements PaymentProvider {
  readonly name: PaymentProviderName = 'paddle';

  isConfigured(): boolean {
    return false;
  }

  createCheckoutSession(
    _params: CheckoutSessionParams,
  ): Promise<CheckoutSessionResult> {
    return Promise.reject(
      new BadRequestException(
        "Le fournisseur de paiement Paddle n'est pas encore disponible",
      ),
    );
  }

  verifyWebhookSignature(_payload: Buffer, _signature: string): boolean {
    return false;
  }

  parseWebhookEvent(_payload: Buffer): NormalizedPaymentEvent {
    throw new BadRequestException(
      "Le fournisseur de paiement Paddle n'est pas encore disponible",
    );
  }
}
