import { describe, expect, it } from 'vitest';
import { generateClaimCode, isValidCodeFormat, normalizeClaimCode } from '../src/lib/code';

describe('Claim Code Generator & Validator', () => {
  it('generates a valid code matching expected format', () => {
    const code = generateClaimCode();
    expect(code).toMatch(/^NOTCHI-[2-9ABCDEFGHJKMNPQRSTVWXYZ]{4}-[2-9ABCDEFGHJKMNPQRSTVWXYZ]{4}$/);
    expect(isValidCodeFormat(code)).toBe(true);
  });

  it('does not contain ambiguous characters (0, O, 1, I, L) in the generated segments', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateClaimCode();
      const segments = code.replace('NOTCHI-', '');
      expect(segments).not.toMatch(/[01OIL]/);
    }
  });

  it('normalizes lowercase and whitespace correctly', () => {
    const input = '  notchi-7k2m-9wp4  ';
    const normalized = normalizeClaimCode(input);
    expect(normalized).toBe('NOTCHI-7K2M-9WP4');
    expect(isValidCodeFormat(normalized)).toBe(true);
  });

  it('rejects invalid code formats', () => {
    expect(isValidCodeFormat('INVALID-CODE')).toBe(false);
    expect(isValidCodeFormat('NOTCHI-1234-5678')).toBe(false); // contains 1
    expect(isValidCodeFormat('NOTCHI-AAAA')).toBe(false); // too short
    expect(isValidCodeFormat('')).toBe(false);
  });
});
