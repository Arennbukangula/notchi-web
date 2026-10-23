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

  while (nextUrl) {
    if (pages >= MAX_PAGES) {
      throw new Error(`GitHub API pagination exceeded ${MAX_PAGES} pages`);
    }

    const response = await fetchImpl(nextUrl, { headers });
    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).trim().slice(0, 300);
      throw new Error(
        `GitHub API request failed with ${response.status} ${response.statusText} for ${nextUrl}${detail ? `: ${detail}` : ''}`,
      );
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
}
