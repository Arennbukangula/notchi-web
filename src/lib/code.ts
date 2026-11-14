import { randomInt } from 'node:crypto';

// Crockford Base32-inspired charset excluding ambiguous characters (0, O, 1, I, L)
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Generates an unambiguous claim code formatted as:
 * NOTCHI-XXXX-XXXX (e.g. NOTCHI-7K2M-9WP4)
 */
export function generateClaimCode(): string {
  const seg1 = Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)]).join('');
  const seg2 = Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)]).join('');
  return `NOTCHI-${seg1}-${seg2}`;
}

/**
 * Normalizes user-input code by trimming, uppercasing, and stripping unexpected punctuation.
 */
export function normalizeClaimCode(input: string): string {
  return (input || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

/**
 * Validates whether the code adheres to the expected format.
 */
export function isValidCodeFormat(code: string): boolean {
  const normalized = normalizeClaimCode(code);
  const regex = /^NOTCHI-[2-9ABCDEFGHJKMNPQRSTVWXYZ]{4}-[2-9ABCDEFGHJKMNPQRSTVWXYZ]{4}$/;
  return regex.test(normalized);
}
