export type AssetKind = 'installer' | 'portable' | 'checksum' | 'other';

export interface AssetRule {
  readonly extensions: readonly string[];
  readonly nameIncludes?: readonly string[];
}

export interface AssetRules {
  readonly installer: AssetRule;
  readonly portable: AssetRule;
  readonly checksum: AssetRule;
}

const githubOwner = process.env.GITHUB_OWNER ?? 'risuunava';
const githubRepo = process.env.GITHUB_REPO ?? 'Notchi';

export const siteConfig = {
  appName: 'Notchi',
  description:
    'Download Notchi, a native notch overlay for Windows 10 and 11. Browse every published version with changelogs, file sizes and checksums.',
  siteUrl: import.meta.env.SITE ?? 'https://notchi-web.vercel.app',
  license: 'Apache-2.0',
  github: {
    owner: githubOwner,
    repo: githubRepo,
    url: `https://github.com/${githubOwner}/${githubRepo}`,
    releasesUrl: `https://github.com/${githubOwner}/${githubRepo}/releases`,
    issuesUrl: `https://github.com/${githubOwner}/${githubRepo}/issues`,
  },
  routes: {
    home: '/',
    download: '/download/',
    latest: '/download/latest',
    docs: '/docs/',
  },
  assetRules: {
    installer: {
      extensions: ['.exe', '.msi'],
      nameIncludes: ['setup', 'install'],
    },
    portable: {
      extensions: ['.zip', '.7z'],
    },
    checksum: {
      extensions: ['.sha256', '.sha256sum'],
      nameIncludes: ['sha256sums'],
    },
  } satisfies AssetRules,
} as const;
