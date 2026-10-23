import semver from 'semver';

export interface VersionedRelease {
  readonly tag: string;
  readonly version: string;
  readonly publishedAt: string;
  readonly prerelease: boolean;
  readonly primaryInstaller?: unknown;
}

export function getVersionFromTag(tag: string): string {
  return tag.trim().replace(/^v/i, '');
}

export function parseVersion(tag: string): semver.SemVer | null {
  return semver.parse(getVersionFromTag(tag));
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function compareReleases(a: VersionedRelease, b: VersionedRelease): number {
  const aVersion = parseVersion(a.tag);
  const bVersion = parseVersion(b.tag);

  if (aVersion && bVersion) {
    const semverResult = semver.rcompare(aVersion, bVersion);
    if (semverResult !== 0) return semverResult;
  }

  const dateResult = timestamp(b.publishedAt) - timestamp(a.publishedAt);
  if (dateResult !== 0) return dateResult;

  return b.tag.localeCompare(a.tag);
}

export function sortReleases<T extends VersionedRelease>(releases: readonly T[]): T[] {
  return [...releases].sort(compareReleases);
}

export function isStable(release: VersionedRelease): boolean {
  return !release.prerelease && release.primaryInstaller !== undefined;
}

export function getLatestStable<T extends VersionedRelease>(releases: readonly T[]): T | undefined {
  return sortReleases(releases.filter(isStable))[0];
}
