import { describe, expect, it } from 'vitest';
import { renderReleaseNotes } from '../src/lib/markdown';

describe('renderReleaseNotes', () => {
  it('renders common release note markup', () => {
    const html = renderReleaseNotes(
      [
        '## Highlights',
        '',
        '- Faster startup',
        '- **Better** animations',
        '',
        '```ts',
        'const x = 1;',
        '```',
      ].join('\n'),
    );

    expect(html).toContain('<h2>Highlights</h2>');
    expect(html).toContain('<li>Faster startup</li>');
    expect(html).toContain('<strong>Better</strong>');
    expect(html).toContain('<pre><code class="language-ts">');
  });

  it('returns an empty string for blank input', () => {
    expect(renderReleaseNotes('')).toBe('');
    expect(renderReleaseNotes('   \n  ')).toBe('');
    expect(renderReleaseNotes(null)).toBe('');
    expect(renderReleaseNotes(undefined)).toBe('');
  });

  it('removes scripts, event handlers and unsafe protocols', () => {
    const html = renderReleaseNotes(
      [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)" alt="bad">',
        '<a href="javascript:alert(1)">click me</a>',
        '<iframe src="https://evil.example"></iframe>',
      ].join('\n\n'),
    );

    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert("xss")');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('<iframe');
    expect(html).toContain('click me');
  });

  it('opens external links safely and keeps relative links', () => {
    const html = renderReleaseNotes('[Guide](https://example.com/guide) and [Docs](/docs/)');

    expect(html).toContain('href="https://example.com/guide"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('href="/docs/"');
  });

  it('allows https images and task list inputs', () => {
    const html = renderReleaseNotes(
      ['![Screenshot](https://example.com/shot.png)', '', '- [x] Fixed', '- [ ] Planned'].join(
        '\n',
      ),
    );

    expect(html).toContain('src="https://example.com/shot.png"');
    expect(html).toContain('alt="Screenshot"');
    expect(html).toContain('<input');
    expect(html).toContain('checked');
  });

  it('drops data URI images', () => {
    const html = renderReleaseNotes('![inline](data:image/png;base64,AAAA)');

    expect(html).not.toContain('data:image');
  });
});
