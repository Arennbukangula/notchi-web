import { describe, expect, it } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { createEntitlement, verifyEntitlement, derivePublicKeyPem, type EntitlementPayload } from '../src/lib/entitlement';

describe('Ed25519 Entitlement Signing & Verification', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

  const samplePayload: EntitlementPayload = {
    v: 1,
    code: 'NOTCHI-7K2M-9WP4',
    claim_number: 42,
    bg_id: 'bg_06',
    badge_id: 'badge_nebula',
    rarity: 'epic',
    device_hash: 'abc123devicehash',
    issued_at: Math.floor(Date.now() / 1000),
  };

  it('signs and verifies a valid entitlement token', () => {
    const token = createEntitlement(samplePayload, privateKeyPem);
    expect(token).toContain('.');

    const verified = verifyEntitlement(token, publicKeyPem);
    expect(verified).not.toBeNull();
    expect(verified?.code).toBe(samplePayload.code);
    expect(verified?.claim_number).toBe(samplePayload.claim_number);
    expect(verified?.bg_id).toBe(samplePayload.bg_id);
    expect(verified?.device_hash).toBe(samplePayload.device_hash);
  });

  it('can verify with private key by deriving public key automatically', () => {
    const token = createEntitlement(samplePayload, privateKeyPem);
    const verified = verifyEntitlement(token, privateKeyPem);
    expect(verified).not.toBeNull();
    expect(verified?.bg_id).toBe('bg_06');
  });

  it('correctly derives public key PEM from private key PEM', () => {
    const derived = derivePublicKeyPem(privateKeyPem);
    expect(derived).toContain('-----BEGIN PUBLIC KEY-----');
    expect(derived).toBe(publicKeyPem);
  });

  it('rejects tampered tokens', () => {
    const token = createEntitlement(samplePayload, privateKeyPem);
    const [payloadPart, sigPart] = token.split('.');

    // Tamper with payload (change bg_06 to bg_07)
    const decoded = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    decoded.bg_id = 'bg_07';
    const tamperedPayloadPart = Buffer.from(JSON.stringify(decoded)).toString('base64url');

    const tamperedToken = `${tamperedPayloadPart}.${sigPart}`;
    const result = verifyEntitlement(tamperedToken, publicKeyPem);
    expect(result).toBeNull();
  });

  it('rejects tokens signed with different key', () => {
    const anotherKey = generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const token = createEntitlement(samplePayload, anotherKey);

    const result = verifyEntitlement(token, publicKeyPem);
    expect(result).toBeNull();
  });

  it('rejects malformed token strings', () => {
    expect(verifyEntitlement('invalid-token', publicKeyPem)).toBeNull();
    expect(verifyEntitlement('', publicKeyPem)).toBeNull();
    expect(verifyEntitlement('a.b.c', publicKeyPem)).toBeNull();
  });
});
