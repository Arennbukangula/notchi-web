import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import fixture from './fixtures/releases.sample.json';
import { fetchReleases } from '../src/lib/github';
import type { GitHubRelease } from '../src/lib/github';

const HASH_B = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
const releases = fixture as GitHubRelease[];

const API_BASE = 'https://api.github.com';
const PAGE_ONE = `${API_BASE}/repos/risuunava/Notchi/releases?per_page=100`;
const PAGE_TWO = `${API_BASE}/repos/risuunava/Notchi/releases?per_page=100&page=2`;
const CHECKSUM_URL = 'https://example.com/checksums/1.1.0.txt';

function requestUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function jsonResponse(data: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function mockGitHub(fetchImpl: typeof fetch): Mock<typeof fetch> {
  return vi.fn<typeof fetch>(async (input) => {
    const url = requestUrl(input);

    if (url === PAGE_ONE) {
      return jsonResponse(releases.slice(0, 3), {
        link: `<${PAGE_TWO}>; rel="next", <${PAGE_ONE}>; rel="last"`,
      });
    }

    if (url === PAGE_TWO) {
      return jsonResponse(releases.slice(3));
    }

    if (url === CHECKSUM_URL) {
      return new Response(
        `${HASH_B}  Notchi-Setup-1.1.0.exe\n${HASH_B} *Notchi-1.1.0-portable.zip\n`,
        { status: 200 },
      );
    }

    return fetchImpl(input);
  });
}

describe('fetchReleases', () => {
  it('paginates, filters drafts, normalizes and sorts releases', async () => {
    const fetchMock = mockGitHub(async () => {
      throw new Error('Unexpected fetch');
    });

    const result = await fetchReleases({ fetchImpl: fetchMock, token: 'test-token' });

    expect(result.map((release) => release.tag)).toEqual([
      'nightly',
      'v1.3.0-beta.1',
      'v1.2.0',
      'v1.1.0',
      'v1.0.0',
    ]);
    expect(result.some((release) => release.tag === 'v1.4.0-draft')).toBe(false);

    const stable = result.filter((release) => release.isLatestStable);
    expect(stable).toHaveLength(1);
    expect(stable[0]?.tag).toBe('v1.2.0');

    const latest = result.find((release) => release.tag === 'v1.2.0');
    expect(latest?.version).toBe('1.2.0');
    expect(latest?.primaryInstaller?.name).toBe('Notchi-Setup-1.2.0.exe');
    expect(latest?.primaryInstaller?.sha256).toBe(
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    );
    expect(latest?.bodyHtml).toContain("<h2>What's new</h2>");
    expect(latest?.bodyHtml).not.toContain('<script');

    const fallbackName = result.find((release) => release.tag === 'v1.0.0');
    expect(fallbackName?.name).toBe('v1.0.0');
    expect(fallbackName?.primaryInstaller).toBeUndefined();
  });

  it('falls back to checksum files when GitHub has no digest', async () => {
    const fetchMock = mockGitHub(async () => {
      throw new Error('Unexpected fetch');
    });

    const result = await fetchReleases({ fetchImpl: fetchMock });
    const release = result.find((item) => item.tag === 'v1.1.0');
    const installer = release?.assets.find((asset) => asset.name === 'Notchi-Setup-1.1.0.exe');
    const portable = release?.assets.find((asset) => asset.name === 'Notchi-1.1.0-portable.zip');

    expect(installer?.sha256).toBe(HASH_B);
    expect(portable?.sha256).toBe(HASH_B);
    expect(installer?.kind).toBe('installer');
    expect(release?.assets.find((asset) => asset.name === 'SHA256SUMS')?.kind).toBe('checksum');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('sends the API headers and optional token', async () => {
    const fetchMock = mockGitHub(async () => {
      throw new Error('Unexpected fetch');
    });

    await fetchReleases({ fetchImpl: fetchMock, token: 'test-token' });

    const init = fetchMock.mock.calls[0]?.[1];
    const headers = init?.headers as Record<string, string> | undefined;

    expect(headers?.Accept).toBe('application/vnd.github+json');
    expect(headers?.['X-GitHub-Api-Version']).toBe('2022-11-28');
    expect(headers?.Authorization).toBe('Bearer test-token');
  });

  it('fails clearly when the GitHub API responds with an error', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response('rate limited', { status: 429, statusText: 'Too Many Requests' }),
    );

    await expect(fetchReleases({ fetchImpl: fetchMock, token: '' })).rejects.toThrow(
      /429 Too Many Requests.*rate limited/,
    );
  });

  it('fails when the payload is not an array', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ message: 'Not found' }));

    await expect(fetchReleases({ fetchImpl: fetchMock })).rejects.toThrow(/unexpected payload/);
  });
});
