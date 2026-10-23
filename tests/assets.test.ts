import { describe, expect, it } from 'vitest';
import {
  applyChecksums,
  classifyAsset,
  extractSha256,
  normalizeAssets,
  parseChecksumFile,
  pickPrimaryInstaller,
} from '../src/lib/assets';
import type { ReleaseAsset } from '../src/lib/assets';

const HASH_A = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const HASH_B = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

function asset(name: string, kind: ReleaseAsset['kind'], sha256?: string): ReleaseAsset {
  return {
    name,
    size: 1,
    downloadCount: 0,
    url: `https://example.com/${name}`,
    kind,
    ...(sha256 ? { sha256 } : {}),
  };
}

describe('classifyAsset', () => {
  it.each([
    ['Notchi-Setup-1.2.0.exe', 'installer'],
    ['Notchi-Installer-1.2.0.MSI', 'installer'],
    ['Notchi.exe', 'other'],
    ['Notchi-App.msi', 'other'],
    ['Notchi-1.2.0-portable.zip', 'portable'],
    ['Notchi-1.2.0-portable.7z', 'portable'],
    ['Notchi-Setup-1.2.0.exe.sha256', 'checksum'],
    ['SHA256SUMS', 'checksum'],
    ['checksums.txt', 'other'],
    ['Notchi-1.2.0-portable.zip.sha256sum', 'checksum'],
    ['release-notes.md', 'other'],
  ])('classifies %s as %s', (name, expected) => {
    expect(classifyAsset(name)).toBe(expected);
  });
});

describe('extractSha256', () => {
  it('reads a valid GitHub digest', () => {
    expect(extractSha256(`sha256:${HASH_A}`)).toBe(HASH_A);
    expect(extractSha256(`SHA256:${HASH_A.toUpperCase()}`)).toBe(HASH_A);
  });

  it('ignores missing or malformed digests', () => {
    expect(extractSha256(null)).toBeUndefined();
    expect(extractSha256('')).toBeUndefined();
    expect(extractSha256('sha256:abc')).toBeUndefined();
    expect(extractSha256(`sha512:${HASH_A}`)).toBeUndefined();
  });
});

describe('parseChecksumFile', () => {
  it('parses GNU, binary and BSD style checksum lines', () => {
    const checksums = parseChecksumFile(
      [
        '# generated checksums',
        `${HASH_A}  Notchi-Setup-1.1.0.exe`,
        `${HASH_B} *Portable/Notchi-1.1.0-portable.zip`,
        `SHA256 (Notchi-Setup-1.0.0.exe) = ${HASH_A}`,
        'not a checksum line',
        '',
      ].join('\n'),
    );

    expect(checksums.get('notchi-setup-1.1.0.exe')).toBe(HASH_A);
    expect(checksums.get('notchi-1.1.0-portable.zip')).toBe(HASH_B);
    expect(checksums.get('notchi-setup-1.0.0.exe')).toBe(HASH_A);
    expect(checksums.size).toBe(3);
  });
});

describe('applyChecksums', () => {
  it('matches names case-insensitively and ignores paths', () => {
    const assets = [asset('Notchi-Setup-1.1.0.exe', 'installer')];
    const result = applyChecksums(assets, new Map([['notchi-setup-1.1.0.exe', HASH_A]]));

    expect(result[0]?.sha256).toBe(HASH_A);
  });

  it('keeps an existing digest and does not annotate checksum assets', () => {
    const assets = [
      asset('Notchi-Setup-1.1.0.exe', 'installer', HASH_A),
      asset('SHA256SUMS', 'checksum'),
    ];
    const result = applyChecksums(
      assets,
      new Map([
        ['notchi-setup-1.1.0.exe', HASH_B],
        ['sha256sums', HASH_B],
      ]),
    );

    expect(result[0]?.sha256).toBe(HASH_A);
    expect(result[1]?.sha256).toBeUndefined();
  });
});

describe('normalizeAssets', () => {
  it('maps GitHub assets to release assets with kind and digest', () => {
    const result = normalizeAssets([
      {
        name: 'Notchi-Setup-1.2.0.exe',
        size: 123,
        download_count: 7,
        browser_download_url: 'https://example.com/setup.exe',
        digest: `sha256:${HASH_A}`,
      },
      {
        name: 'Notchi-1.2.0-portable.zip',
        size: 456,
        download_count: 2,
        browser_download_url: 'https://example.com/portable.zip',
        digest: null,
      },
    ]);

    expect(result).toEqual([
      {
        name: 'Notchi-Setup-1.2.0.exe',
        size: 123,
        downloadCount: 7,
        url: 'https://example.com/setup.exe',
        kind: 'installer',
        sha256: HASH_A,
      },
      {
        name: 'Notchi-1.2.0-portable.zip',
        size: 456,
        downloadCount: 2,
        url: 'https://example.com/portable.zip',
        kind: 'portable',
      },
    ]);
  });
});

describe('pickPrimaryInstaller', () => {
  it('prefers an installer over a portable build', () => {
    const portable = asset('Notchi-portable.zip', 'portable');
    const installer = asset('Notchi-Setup.exe', 'installer');

    expect(pickPrimaryInstaller([portable, installer])).toBe(installer);
  });

  it('falls back to the first .exe when no installer is classified', () => {
    const fallback = asset('Notchi-nightly.exe', 'other');
    const other = asset('notes.txt', 'other');

    expect(pickPrimaryInstaller([other, fallback])).toBe(fallback);
  });

  it('returns undefined when there is no executable', () => {
    expect(pickPrimaryInstaller([asset('Notchi-portable.zip', 'portable')])).toBeUndefined();
    expect(pickPrimaryInstaller([])).toBeUndefined();
  });
});
