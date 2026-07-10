import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Vérifie une signature HMAC-SHA256 de webhook en comparaison temps constant.
 *
 * Échoue TOUJOURS (retourne false) si `secret` est vide/absent, plutôt que
 * de calculer un HMAC avec une clé vide — un secret de webhook mal
 * configuré en production ne doit jamais aboutir à une signature
 * prévisible/forgeable. Tout futur PaymentProvider (Moneroo, PawaPay...)
 * doit utiliser cette fonction pour implémenter verifyWebhookSignature().
 */
export function verifyHmacSignature(
  payload: Buffer,
  signatureHex: string,
  secret: string | undefined | null,
): boolean {
  if (!secret || !signatureHex) return false;

  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signatureHex, 'hex');

  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
