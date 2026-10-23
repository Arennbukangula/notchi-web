import en from './en.json';
import id from './id.json';

export const defaultLocale = 'en' as const;
export const locales = ['en', 'id'] as const;

export type Locale = (typeof locales)[number];

type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};

type Dictionary = DeepString<typeof en>;

type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}`;
}[keyof T & string];

export type TranslationKey = Paths<Dictionary>;

const dictionaries: Record<Locale, Dictionary> = { en, id };

function lookup(dictionary: Dictionary, key: string): string | undefined {
  let current: unknown = dictionary;

  for (const segment of key.split('.')) {
    if (typeof current !== 'object' || current === null || !(segment in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === 'string' ? current : undefined;
}

function interpolate(value: string, params?: Record<string, string | number>): string {
  if (!params) return value;

  return value.replace(/\{(\w+)\}/g, (match, name: string) => {
    const replacement = params[name];
    return replacement === undefined ? match : String(replacement);
  });
}

export function t(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const value =
    lookup(dictionaries[locale], key) ?? lookup(dictionaries[defaultLocale], key) ?? key;

  return interpolate(value, params);
}

export function getLocaleFromUrl(url: URL | string): Locale {
  const pathname =
    typeof url === 'string' ? new URL(url, 'https://notchi.local').pathname : url.pathname;
  const firstSegment = pathname.split('/').filter(Boolean)[0];

  return firstSegment === 'id' ? 'id' : defaultLocale;
}

export function stripLocaleFromPath(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;

  if (path === '/id' || path === '/id/') return '/';
  if (path.startsWith('/id/')) return path.slice('/id'.length);

  return path;
}

export function localizePath(pathname: string, locale: Locale): string {
  const path = stripLocaleFromPath(pathname);

  if (locale === defaultLocale) return path;
  return path === '/' ? '/id/' : `/id${path}`;
}
