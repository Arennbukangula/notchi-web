import { describe, expect, it } from 'vitest';
import { formatDate, formatFileSize, formatNumber } from '../src/lib/format';

describe('formatFileSize', () => {
  it('formats bytes using decimal units', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1500)).toBe('1.5 KB');
    expect(formatFileSize(52_992_057)).toBe('53 MB');
    expect(formatFileSize(72_535_455)).toBe('72.5 MB');
  });

  it('uses the requested locale and handles invalid values', () => {
    expect(formatFileSize(1_500_000, 'id')).toBe('1,5 MB');
    expect(formatFileSize(Number.NaN)).toBe('—');
    expect(formatFileSize(-1)).toBe('—');
  });
});

describe('formatDate', () => {
  it('formats ISO dates in UTC with the requested locale', () => {
    expect(formatDate('2026-10-21T03:56:16Z')).toBe('Oct 21, 2026');
    expect(formatDate('2026-10-21T03:56:16Z', 'id')).toContain('2026');
    expect(formatDate('2026-01-01T23:30:00-05:00')).toBe('Jan 2, 2026');
  });

  it('returns a dash for empty or invalid dates', () => {
    expect(formatDate('')).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('formatNumber', () => {
  it('formats counts for the requested locale', () => {
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber(1234, 'id')).toBe('1.234');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('—');
  });
});
