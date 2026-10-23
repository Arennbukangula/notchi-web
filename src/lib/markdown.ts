import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import type { IOptions } from 'sanitize-html';

const sanitizeOptions: IOptions = {
  allowedTags: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'br',
    'hr',
    'strong',
    'b',
    'em',
    'i',
    'del',
    's',
    'ins',
    'u',
    'blockquote',
    'ul',
    'ol',
    'li',
    'code',
    'pre',
    'a',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'details',
    'summary',
    'input',
    'span',
    'div',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    code: ['class'],
    th: ['align'],
    td: ['align'],
    input: ['type', 'checked', 'disabled'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https'],
  },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const external = /^https?:\/\//i.test(attribs.href ?? '');
      return {
        tagName,
        attribs: {
          ...attribs,
          ...(external ? { target: '_blank' } : {}),
          rel: 'noopener noreferrer',
        },
      };
    },
  },
};

export function renderReleaseNotes(markdown: string | null | undefined): string {
  const source = markdown?.trim();
  if (!source) return '';

  const html = marked.parse(source, { async: false, gfm: true });
  return sanitizeHtml(html, sanitizeOptions);
}

function decodeCodePoint(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 0x10ffff) return '';

  try {
    return String.fromCodePoint(value);
  } catch {
    return '';
  }
}

export function toPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => decodeCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => decodeCodePoint(Number.parseInt(code, 16)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
