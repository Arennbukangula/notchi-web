import { describe, expect, it } from 'vitest';
import { defaultLocale, getLocaleFromUrl, localizePath, stripLocaleFromPath, t } from '../src/i18n';

describe('getLocaleFromUrl', () => {
  it('detects the Indonesian prefix from strings and URL objects', () => {
    expect(getLocaleFromUrl('/id/')).toBe('id');
    expect(getLocaleFromUrl('/id/download/')).toBe('id');
    expect(getLocaleFromUrl(new URL('https://example.com/id/docs'))).toBe('id');
  });

  it('defaults to English for unprefixed and unrelated paths', () => {
    expect(defaultLocale).toBe('en');
    expect(getLocaleFromUrl('/')).toBe('en');
    expect(getLocaleFromUrl('/download/')).toBe('en');
    expect(getLocaleFromUrl('/idaho')).toBe('en');
  });
});

describe('locale paths', () => {
  it('strips the Indonesian prefix without touching other paths', () => {
    expect(stripLocaleFromPath('/id')).toBe('/');
    expect(stripLocaleFromPath('/id/')).toBe('/');
    expect(stripLocaleFromPath('/id/download/')).toBe('/download/');
    expect(stripLocaleFromPath('/download/')).toBe('/download/');
    expect(stripLocaleFromPath('/idaho')).toBe('/idaho');
  });

  it('localizes paths for each locale', () => {
    expect(localizePath('/', 'en')).toBe('/');
    expect(localizePath('/', 'id')).toBe('/id/');
    expect(localizePath('/download/', 'en')).toBe('/download/');
    expect(localizePath('/download/', 'id')).toBe('/id/download/');
    expect(localizePath('/id/docs', 'en')).toBe('/docs');
    expect(localizePath('/id/docs', 'id')).toBe('/id/docs');
  });
});

describe('t', () => {
  it('returns translations for the requested locale', () => {
    expect(t('en', 'nav.docs')).toBe('Docs');
    expect(t('id', 'nav.docs')).toBe('Dokumentasi');
    expect(t('id', 'home.placeholderBody')).toBe('Situs unduhan sedang dibangun.');
  });

  it('interpolates parameters', () => {
    expect(t('en', 'footer.copyright', { year: 2026 })).toBe('© 2026 Notchi');
    expect(t('en', 'meta.titleTemplate', { title: 'Versions', site: 'Notchi' })).toBe(
      'Versions · Notchi',
    );
  });

  it('falls back to the key when a translation is missing', () => {
    const missing = 'missing.key' as Parameters<typeof t>[1];
    expect(t('en', missing)).toBe('missing.key');
  });
});
