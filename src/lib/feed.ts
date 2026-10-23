import rss from '@astrojs/rss';
import { localizePath, t } from '../i18n';
import type { Locale } from '../i18n';
import { siteConfig } from '../site.config';
import { getReleases } from './github';
import { toPlainText } from './markdown';

const EXCERPT_LENGTH = 300;

function excerpt(html: string): string {
  const text = toPlainText(html);
  if (text.length <= EXCERPT_LENGTH) return text;

  const slice = text.slice(0, EXCERPT_LENGTH);
  const lastSpace = slice.lastIndexOf(' ');
  return `${lastSpace > EXCERPT_LENGTH / 2 ? slice.slice(0, lastSpace) : slice}…`;
}

export async function createReleasesFeed(site: URL | undefined, locale: Locale): Promise<Response> {
  const releases = await getReleases();
  const base = site ?? new URL(siteConfig.siteUrl);

  return rss({
    title: t(locale, 'rss.title'),
    description: t(locale, 'rss.description'),
    site: base,
    items: releases.map((release) => {
      const pubDate = release.publishedAt ? new Date(release.publishedAt) : undefined;
      const validDate = pubDate && !Number.isNaN(pubDate.getTime());

      return {
        title: `${siteConfig.appName} ${release.tag}`,
        link: localizePath(`/download/${encodeURIComponent(release.version)}/`, locale),
        description: excerpt(release.bodyHtml) || t(locale, 'version.noNotes'),
        categories: release.prerelease ? ['pre-release'] : ['stable'],
        ...(validDate ? { pubDate } : {}),
      };
    }),
    customData: `<language>${locale === 'id' ? 'id-id' : 'en-us'}</language>`,
  });
}
