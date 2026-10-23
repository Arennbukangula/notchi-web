import { siteConfig } from '../site.config';
import type { AssetKind, AssetRule, AssetRules } from '../site.config';

export interface RawReleaseAsset {
  readonly name: string;
  readonly size: number;
  readonly download_count: number;
  readonly browser_download_url: string;
  readonly digest?: string | null;
}

export interface ReleaseAsset {
  readonly name: string;
  readonly size: number;
  readonly downloadCount: number;
  readonly url: string;
  readonly kind: AssetKind;
  readonly sha256?: string;
}

function matchesExtension(name: string, rule: AssetRule): boolean {
  return rule.extensions.some((extension) => name.endsWith(extension.toLowerCase()));
}

function matchesName(name: string, rule: AssetRule): boolean {
  return (rule.nameIncludes ?? []).some((part) => name.includes(part.toLowerCase()));
}

export function classifyAsset(name: string, rules: AssetRules = siteConfig.assetRules): AssetKind {
  const lowerName = name.trim().toLowerCase();

  if (matchesExtension(lowerName, rules.checksum) || matchesName(lowerName, rules.checksum)) {
    return 'checksum';
  }

  if (
    matchesExtension(lowerName, rules.installer) &&
    (!rules.installer.nameIncludes?.length || matchesName(lowerName, rules.installer))
  ) {
    return 'installer';
  }

  if (matchesExtension(lowerName, rules.portable)) {
    return 'portable';
  }

  return 'other';
}

export function extractSha256(digest: string | null | undefined): string | undefined {
  const match = /^sha256:([a-f0-9]{64})$/i.exec(digest?.trim() ?? '');
  return match?.[1].toLowerCase();
}

function baseName(path: string): string {
  return (path.split(/[\\/]/).pop() ?? path).trim().toLowerCase();
}

function normalizeAssetName(name: string): string {
  return baseName(name.replace(/^\*/, ''));
}

export function parseChecksumFile(content: string): Map<string, string> {
  const checksums = new Map<string, string>();

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const bsd = /^sha256\s*\((.+)\)\s*=\s*([a-f0-9]{64})$/i.exec(line);
    if (bsd?.[1] && bsd[2]) {
      checksums.set(normalizeAssetName(bsd[1]), bsd[2].toLowerCase());
      continue;
    }

    const gnu = /^([a-f0-9]{64})\s+\*?(.+)$/i.exec(line);
    if (gnu?.[1] && gnu[2]) {
      checksums.set(normalizeAssetName(gnu[2]), gnu[1].toLowerCase());
    }
  }

  return checksums;
}

export function applyChecksums(
  assets: readonly ReleaseAsset[],
  checksums: ReadonlyMap<string, string>,
): ReleaseAsset[] {
  return assets.map((asset) => {
    if (asset.kind === 'checksum' || asset.sha256) return asset;

    const sha256 = checksums.get(normalizeAssetName(asset.name));
    return sha256 ? { ...asset, sha256 } : asset;
  });
}

export function normalizeAssets(rawAssets: readonly RawReleaseAsset[]): ReleaseAsset[] {
  return rawAssets.map((raw) => {
    const sha256 = extractSha256(raw.digest);

    return {
      name: raw.name,
      size: raw.size,
      downloadCount: raw.download_count,
      url: raw.browser_download_url,
      kind: classifyAsset(raw.name),
      ...(sha256 ? { sha256 } : {}),
    };
  });
}

export function pickPrimaryInstaller(assets: readonly ReleaseAsset[]): ReleaseAsset | undefined {
  return (
    assets.find((asset) => asset.kind === 'installer') ??
    assets.find((asset) => asset.name.toLowerCase().endsWith('.exe'))
  );
}
