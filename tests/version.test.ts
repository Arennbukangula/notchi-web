import { describe, expect, it } from 'vitest';
import {
  compareReleases,
  getLatestStable,
  getVersionFromTag,
  parseVersion,
  sortReleases,
} from '../src/lib/version';

function release(
  tag: string,
  publishedAt: string,
  options: { prerelease?: boolean; hasInstaller?: boolean } = {},
) {
  return {
    tag,
    version: getVersionFromTag(tag),
    publishedAt,
    prerelease: options.prerelease ?? false,
    ...(options.hasInstaller === false ? {} : { primaryInstaller: { name: 'setup.exe' } }),
  };
}

describe('getVersionFromTag', () => {
  it('removes a single leading v or V', () => {
    expect(getVersionFromTag('v1.2.3')).toBe('1.2.3');
    expect(getVersionFromTag('V2.0.0')).toBe('2.0.0');
    expect(getVersionFromTag('  v1.0.0  ')).toBe('1.0.0');
  });

  it('leaves non-semver tags intact', () => {
    expect(getVersionFromTag('nightly')).toBe('nightly');
  });
});

describe('parseVersion', () => {
  it('parses semver tags with an optional v prefix', () => {
    expect(parseVersion('v1.2.3')?.toString()).toBe('1.2.3');
    expect(parseVersion('1.2.3-beta.1')?.toString()).toBe('1.2.3-beta.1');
    expect(parseVersion('1.2.3+build.5')?.version).toBe('1.2.3');
  });

  it('returns null for tags that are not semver', () => {
    expect(parseVersion('nightly')).toBeNull();
    expect(parseVersion('v1.0')).toBeNull();
    expect(parseVersion('')).toBeNull();
  });
});

describe('sortReleases', () => {
  it('sorts by semver descending, not lexically', () => {
    const releases = [
      release('v1.2.0', '2026-01-01T00:00:00Z'),
      release('v2.0.0', '2025-01-01T00:00:00Z'),
      release('v1.10.0', '2024-01-01T00:00:00Z'),
      release('v0.9.0', '2026-05-01T00:00:00Z'),
    ];

    expect(sortReleases(releases).map((item) => item.tag)).toEqual([
      'v2.0.0',
      'v1.10.0',
      'v1.2.0',
      'v0.9.0',
    ]);
  });

  it('places prereleases below the matching stable version', () => {
    const releases = [
      release('v2.0.0-beta.2', '2026-02-01T00:00:00Z', { prerelease: true }),
      release('v2.0.0', '2026-01-01T00:00:00Z'),
    ];

    expect(sortReleases(releases).map((item) => item.tag)).toEqual(['v2.0.0', 'v2.0.0-beta.2']);
  });

  it('falls back to published date for non-semver tags', () => {
    const releases = [
      release('nightly', '2026-01-01T00:00:00Z'),
      release('beta', '2026-03-01T00:00:00Z'),
    ];

    expect(sortReleases(releases).map((item) => item.tag)).toEqual(['beta', 'nightly']);
  });

  it('uses the date when semver versions are equal', () => {
    const newer = release('v1.0.0+build.2', '2026-03-01T00:00:00Z');
    const older = release('v1.0.0+build.1', '2026-02-01T00:00:00Z');

    expect(compareReleases(newer, older)).toBeLessThan(0);
    expect(sortReleases([older, newer])).toEqual([newer, older]);
  });

  it('does not mutate the input array', () => {
    const releases = [
      release('v1.0.0', '2026-01-01T00:00:00Z'),
      release('v2.0.0', '2025-01-01T00:00:00Z'),
    ];
    const copy = [...releases];

    sortReleases(releases);
    expect(releases).toEqual(copy);
  });
});

describe('getLatestStable', () => {
  it('returns the highest stable release that has an installer', () => {
    const releases = [
      release('v2.0.0', '2026-09-01T00:00:00Z', { prerelease: true }),
      release('v1.5.0', '2026-01-01T00:00:00Z'),
      release('v1.9.0', '2026-02-01T00:00:00Z', { hasInstaller: false }),
    ];

    expect(getLatestStable(releases)?.tag).toBe('v1.5.0');
  });

  it('returns undefined when there is no stable release with an installer', () => {
    expect(
      getLatestStable([
        release('v1.0.0', '2026-01-01T00:00:00Z', { prerelease: true }),
        release('v1.1.0', '2026-02-01T00:00:00Z', { hasInstaller: false }),
      ]),
    ).toBeUndefined();
    expect(getLatestStable([])).toBeUndefined();
  });
});
