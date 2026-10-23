import type { Locale } from '../i18n';

function intlLocale(locale: Locale): string {
  return locale === 'id' ? 'id-ID' : 'en-US';
}

export function formatFileSize(bytes: number, locale: Locale = 'en'): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }

  const formatter = new Intl.NumberFormat(intlLocale(locale), {
    maximumFractionDigits: value >= 100 ? 0 : 1,
  });

  return `${formatter.format(value)} ${units[unitIndex]}`;
}

export function formatDate(isoDate: string, locale: Locale = 'en'): string {
  if (!isoDate) return '—';

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date);
}

export function formatNumber(value: number, locale: Locale = 'en'): string {
  if (!Number.isFinite(value)) return '—';

  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}
