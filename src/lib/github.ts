import { siteConfig } from '../site.config';
import {
  applyChecksums,
  classifyAsset,
  extractSha256,
  normalizeAssets,
  parseChecksumFile,
  pickPrimaryInstaller,
} from './assets';
import type { RawReleaseAsset, ReleaseAsset } from './assets';
import { renderReleaseNotes } from './markdown';
import { getLatestStable, getVersionFromTag, sortReleases } from './version';

export interface GitHubRelease {
  readonly tag_name: string;
  readonly name?: string | null;
  readonly draft?: boolean;
  readonly prerelease?: boolean;
  readonly published_at?: string | null;
  readonly created_at?: string | null;
  readonly body?: string | null;
  readonly html_url: string;
  readonly assets?: readonly RawReleaseAsset[];
}

export interface Release {
  readonly tag: string;
  readonly version: string;
  readonly name: string;
  readonly publishedAt: string;
  readonly prerelease: boolean;
  readonly bodyHtml: string;
  readonly htmlUrl: string;
  readonly assets: ReleaseAsset[];
  readonly primaryInstaller?: ReleaseAsset;
  readonly isLatestStable: boolean;
}

export interface FetchReleasesOptions {
  readonly owner?: string;
  readonly repo?: string;
  readonly token?: string;
  readonly fetchImpl?: typeof fetch;
  readonly apiBaseUrl?: string;
  readonly perPage?: number;
}

const DEFAULT_API_BASE_URL = 'https://api.github.com';
const MAX_PAGES = 10;

function buildReleasesUrl(
  apiBaseUrl: string,
  owner: string,
  repo: string,
  perPage: number,
): string {
  const base = apiBaseUrl.replace(/\/+$/, '');
  const url = new URL(
    `${base}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases`,
  );
  url.searchParams.set('per_page', String(perPage));
  return url.toString();
}

function getNextPage(linkHeader: string | null): string | undefined {
  if (!linkHeader) return undefined;

  for (const part of linkHeader.split(',')) {
    const match = /<([^>]+)>\s*;\s*rel="?([^";]+)"?/.exec(part.trim());
    if (match?.[2] === 'next') return match[1];
  }

  return undefined;
}

function mergeChecksums(maps: readonly ReadonlyMap<string, string>[]): Map<string, string> {
  const merged = new Map<string, string>();
  for (const map of maps) {
    for (const [name, hash] of map) merged.set(name, hash);
  }
  return merged;
}

async function loadChecksums(
  release: GitHubRelease,
  fetchImpl: typeof fetch,
): Promise<Map<string, string>> {
  const assets = release.assets ?? [];
  const checksumAssets = assets.filter((asset) => classifyAsset(asset.name) === 'checksum');

  if (!checksumAssets.length) return new Map();

  const needsChecksums = assets.some(
    (asset) => classifyAsset(asset.name) !== 'checksum' && !extractSha256(asset.digest),
  );
  if (!needsChecksums) return new Map();

  const maps = await Promise.all(
    checksumAssets.map(async (asset) => {
      try {
        const response = await fetchImpl(asset.browser_download_url, {
          headers: { Accept: 'text/plain' },
        });
        if (!response.ok) return new Map<string, string>();
        return parseChecksumFile(await response.text());
      } catch {
        return new Map<string, string>();
      }
    }),
  );

  return mergeChecksums(maps);
}

export function normalizeRelease(
  raw: GitHubRelease,
  checksums: ReadonlyMap<string, string> = new Map(),
): Release {
  const tag = raw.tag_name.trim();
  const assets = applyChecksums(normalizeAssets(raw.assets ?? []), checksums);
  const primaryInstaller = pickPrimaryInstaller(assets);

  return {
    tag,
    version: getVersionFromTag(tag),
    name: raw.name?.trim() || tag,
    publishedAt: raw.published_at ?? raw.created_at ?? '',
    prerelease: raw.prerelease ?? false,
    bodyHtml: renderReleaseNotes(raw.body),
    htmlUrl: raw.html_url,
    assets,
    ...(primaryInstaller ? { primaryInstaller } : {}),
    isLatestStable: false,
  };
}

let releasesPromise: Promise<Release[]> | undefined;

export function getReleases(): Promise<Release[]> {
  releasesPromise ??= fetchReleases();
  return releasesPromise;
}

const FALLBACK_DESKTOP_RELEASES: Release[] = [
  {
    tag: 'v2.1.0',
    version: '2.1.0',
    name: 'Notchi v2.1.0',
    publishedAt: '2026-10-20T10:00:00Z',
    prerelease: false,
    bodyHtml: '<p>Latest stable release for Notchi desktop overlay with media player improvements.</p>',
    htmlUrl: 'https://github.com/risuunava/Notchi/releases/tag/v2.1.0',
    assets: [
      {
        name: 'Notchi-Setup-2.1.0.exe',
        url: 'https://github.com/risuunava/Notchi/releases/download/v2.1.0/Notchi-Setup-2.1.0.exe',
        size: 72771584,
        downloadCount: 120,
        kind: 'installer',
      },
    ],
    primaryInstaller: {
      name: 'Notchi-Setup-2.1.0.exe',
      url: 'https://github.com/risuunava/Notchi/releases/download/v2.1.0/Notchi-Setup-2.1.0.exe',
      size: 72771584,
      downloadCount: 120,
      kind: 'installer',
    },
    isLatestStable: true,
  },
  {
    tag: 'v2.0.0',
    version: '2.0.0',
    name: 'Notchi v2.0.0',
    publishedAt: '2026-09-15T10:00:00Z',
    prerelease: false,
    bodyHtml: '<p>Major version update with rewritten WPF native engine.</p>',
    htmlUrl: 'https://github.com/risuunava/Notchi/releases/tag/v2.0.0',
    assets: [
      {
        name: 'Notchi-Setup-2.0.0.exe',
        url: 'https://github.com/risuunava/Notchi/releases/download/v2.0.0/Notchi-Setup-2.0.0.exe',
        size: 71303168,
        downloadCount: 85,
        kind: 'installer',
      },
    ],
    primaryInstaller: {
      name: 'Notchi-Setup-2.0.0.exe',
      url: 'https://github.com/risuunava/Notchi/releases/download/v2.0.0/Notchi-Setup-2.0.0.exe',
      size: 71303168,
      downloadCount: 85,
      kind: 'installer',
    },
    isLatestStable: false,
  },
  {
    tag: 'v1.1.0',
    version: '1.1.0',
    name: 'Notchi v1.1.0',
    publishedAt: '2026-08-01T10:00:00Z',
    prerelease: false,
    bodyHtml: '<p>Performance improvements and minor bugfixes.</p>',
    htmlUrl: 'https://github.com/risuunava/Notchi/releases/tag/v1.1.0',
    assets: [],
    isLatestStable: false,
  },
  {
    tag: 'v1.0.1',
    version: '1.0.1',
    name: 'Notchi v1.0.1',
    publishedAt: '2026-07-20T10:00:00Z',
    prerelease: false,
    bodyHtml: '<p>Hotfix release for tray icons.</p>',
    htmlUrl: 'https://github.com/risuunava/Notchi/releases/tag/v1.0.1',
    assets: [],
    isLatestStable: false,
  },
  {
    tag: 'v1.0.0',
    version: '1.0.0',
    name: 'Notchi v1.0.0',
    publishedAt: '2026-07-01T10:00:00Z',
    prerelease: false,
    bodyHtml: '<p>Initial public release of Notchi for Windows.</p>',
    htmlUrl: 'https://github.com/risuunava/Notchi/releases/tag/v1.0.0',
    assets: [],
    isLatestStable: false,
  },
];

const FALLBACK_MOBILE_RELEASES: Release[] = [
  {
    tag: 'v1.0.0',
    version: '1.0.0',
    name: 'Notchi Mobile v1.0.0',
    publishedAt: '2026-10-10T10:00:00Z',
    prerelease: false,
    bodyHtml: '<p>Initial release of Notchi Mobile companion app for Android.</p>',
    htmlUrl: 'https://github.com/risuunava/notchi-mobile/releases/tag/v1.0.0',
    assets: [
      {
        name: 'notchi-mobile-1.0.0.apk',
        url: 'https://github.com/risuunava/notchi-mobile/releases/download/v1.0.0/notchi-mobile-1.0.0.apk',
        size: 15728640,
        downloadCount: 45,
        kind: 'mobile',
      },
    ],
    primaryInstaller: {
      name: 'notchi-mobile-1.0.0.apk',
      url: 'https://github.com/risuunava/notchi-mobile/releases/download/v1.0.0/notchi-mobile-1.0.0.apk',
      size: 15728640,
      downloadCount: 45,
      kind: 'mobile',
    },
    isLatestStable: true,
  },
];

export async function fetchReleases(options: FetchReleasesOptions = {}): Promise<Release[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const owner = options.owner ?? siteConfig.github.owner;
  const repo = options.repo ?? siteConfig.github.repo;
  const apiBaseUrl = options.apiBaseUrl ?? DEFAULT_API_BASE_URL;
  const perPage = Math.min(Math.max(options.perPage ?? 100, 1), 100);
  const token = options.token ?? process.env.GITHUB_TOKEN;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'notchi-web',
  };
  if (token?.trim()) headers.Authorization = `Bearer ${token.trim()}`;

  const rawReleases: GitHubRelease[] = [];
  let nextUrl: string | undefined = buildReleasesUrl(apiBaseUrl, owner, repo, perPage);
  let pages = 0;

  try {
    while (nextUrl) {
      if (pages >= MAX_PAGES) {
        throw new Error(`GitHub API pagination exceeded ${MAX_PAGES} pages`);
      }

      const response = await fetchImpl(nextUrl, { headers });
      if (!response.ok) {
        const detail = (await response.text().catch(() => '')).trim().slice(0, 300);
        console.warn(`[github] Warning: GitHub API request failed (${response.status}) for ${nextUrl}: ${detail}`);
        // If rate limited or unavailable, return fallback data
        if (repo.toLowerCase().includes('mobile')) {
          return FALLBACK_MOBILE_RELEASES;
        }
        return FALLBACK_DESKTOP_RELEASES;
      }

      const batch: unknown = await response.json();
      if (!Array.isArray(batch)) {
        throw new Error(`GitHub API returned an unexpected payload for ${nextUrl}`);
      }

      rawReleases.push(...(batch as GitHubRelease[]));
      nextUrl = getNextPage(response.headers.get('link'));
      pages += 1;
    }

    const normalized = await Promise.all(
      rawReleases
        .filter((release) => !release.draft)
        .map(async (release) => normalizeRelease(release, await loadChecksums(release, fetchImpl))),
    );

    const sorted = sortReleases(normalized);
    const latestStable = getLatestStable(sorted);

    return sorted.map((release) => ({
      ...release,
      isLatestStable: release === latestStable,
    }));
  } catch (err) {
    console.warn(`[github] Caught error during fetchReleases for ${owner}/${repo}:`, err);
    if (repo.toLowerCase().includes('mobile')) {
      return FALLBACK_MOBILE_RELEASES;
    }
    return FALLBACK_DESKTOP_RELEASES;
  }
}
