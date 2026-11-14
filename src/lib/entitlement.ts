import { sign, verify, createPrivateKey, createPublicKey } from 'node:crypto';

export interface EntitlementPayload {
  v: 1;
  code: string;
  claim_number: number;
  bg_id: string;
  badge_id: string;
  rarity: string;
  device_hash: string;
  issued_at: number;
}

function normalizeKey(keyStr: string): string {
  const trimmed = (keyStr || '').trim();
  if (trimmed.startsWith('-----BEGIN')) {
    return trimmed;
  }
  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
    if (decoded.includes('-----BEGIN')) {
      return decoded;
    }
  } catch {
    // Keep as is
  }
  return trimmed;
}

/**
 * Derives public key PEM from private key PEM
 */
export function derivePublicKeyPem(privateKeyPem: string): string {
  const privateKey = createPrivateKey(normalizeKey(privateKeyPem));
  return createPublicKey(privateKey).export({ type: 'spki', format: 'pem' }).toString();
}

/**
 * Signs entitlement payload using Ed25519 private key.
 * Format: base64url(payload) + "." + base64url(signature)
 */
export function createEntitlement(payload: EntitlementPayload, privateKeyPem: string): string {
  const cleanKey = normalizeKey(privateKeyPem);
  const json = JSON.stringify(payload);
  const data = Buffer.from(json, 'utf8');

  const privateKey = createPrivateKey(cleanKey);
  const signature = sign(null, data, privateKey);

  return `${data.toString('base64url')}.${signature.toString('base64url')}`;
}

/**
 * Verifies entitlement token using public key (or derived from private key).
 */
export function verifyEntitlement(token: string, keyPem: string): EntitlementPayload | null {
  try {
    const parts = (token || '').trim().split('.');
    if (parts.length !== 2) return null;

    const data = Buffer.from(parts[0], 'base64url');
    const signature = Buffer.from(parts[1], 'base64url');

    const cleanKey = normalizeKey(keyPem);
    let publicKey;
    try {
      publicKey = createPublicKey(cleanKey);
    } catch {
      // If private key was passed instead of public key, derive public key
      publicKey = createPublicKey(createPrivateKey(cleanKey));
    }

    const isValid = verify(null, data, publicKey, signature);
    if (!isValid) return null;

    const payload = JSON.parse(data.toString('utf8')) as EntitlementPayload;
    if (payload.v !== 1 || !payload.code || !payload.bg_id) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
