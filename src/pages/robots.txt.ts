import type { APIRoute } from 'astro';
import { siteConfig } from '../site.config';

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL(siteConfig.siteUrl);
  const sitemap = new URL('sitemap-index.xml', base).href;

  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
