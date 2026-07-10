import { Injectable, BadRequestException } from '@nestjs/common';
import {
  CheckoutSessionParams,
  CheckoutSessionResult,
  NormalizedPaymentEvent,
  PaymentProvider,
  PaymentProviderName,
} from '../../interfaces/payment-provider.interface';

/**
 * Placeholder pour le fournisseur de paiement Paystack.
 *
 * Non implémenté intentionnellement : aucune clé Paystack réelle, aucun SDK
 * Paystack, aucun appel réseau. Ce provider existe pour documenter le
 * contrat à respecter (PaymentProvider) lorsque l'intégration Paystack sera
 * ajoutée, et pour permettre à PaymentProviderFactory de le sélectionner
 * sans modifier l'architecture.
 */
@Injectable()
export class PaystackProvider implements PaymentProvider {
  readonly name: PaymentProviderName = 'paystack';

  isConfigured(): boolean {
    return false;
  }

  createCheckoutSession(
    _params: CheckoutSessionParams,
  ): Promise<CheckoutSessionResult> {
    return Promise.reject(
      new BadRequestException(
        "Le fournisseur de paiement Paystack n'est pas encore disponible",
      ),
    );
  }

  verifyWebhookSignature(_payload: Buffer, _signature: string): boolean {
    return false;
  }

  parseWebhookEvent(_payload: Buffer): NormalizedPaymentEvent {
    throw new BadRequestException(
      "Le fournisseur de paiement Paystack n'est pas encore disponible",
    );
  }
}
