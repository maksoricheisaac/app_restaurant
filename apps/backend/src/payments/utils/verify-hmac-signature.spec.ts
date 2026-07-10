import { createHmac } from 'crypto';
import { verifyHmacSignature } from './verify-hmac-signature';

describe('verifyHmacSignature', () => {
  const payload = Buffer.from(JSON.stringify({ hello: 'world' }));
  const secret = 'a-real-secret';

  function sign(body: Buffer, key: string) {
    return createHmac('sha256', key).update(body).digest('hex');
  }

  it('returns true for a valid signature', () => {
    expect(verifyHmacSignature(payload, sign(payload, secret), secret)).toBe(
      true,
    );
  });

  it('returns false for a tampered payload', () => {
    const sig = sign(payload, secret);
    const tampered = Buffer.from(JSON.stringify({ hello: 'mallory' }));
    expect(verifyHmacSignature(tampered, sig, secret)).toBe(false);
  });

  it('returns false for a wrong secret', () => {
    const sig = sign(payload, 'wrong-secret');
    expect(verifyHmacSignature(payload, sig, secret)).toBe(false);
  });

  it('fails closed when the secret is empty, instead of hashing with an empty key', () => {
    const sigWithEmptyKey = sign(payload, '');
    expect(verifyHmacSignature(payload, sigWithEmptyKey, '')).toBe(false);
    expect(verifyHmacSignature(payload, sigWithEmptyKey, undefined)).toBe(
      false,
    );
    expect(verifyHmacSignature(payload, sigWithEmptyKey, null)).toBe(false);
  });

  it('fails closed when the signature header is missing', () => {
    expect(verifyHmacSignature(payload, '', secret)).toBe(false);
  });
});
