// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const siteUrl = process.env.SITE_URL ?? 'https://notchi-web-tau.vercel.app';

export default defineConfig({
  site: siteUrl,
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => !/(\/download\/latest\/|\/rss\.xml|\/robots\.txt)$/.test(page),
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          id: 'id-ID',
        },
      },
    }),
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'id'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
