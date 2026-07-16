import { describe, expect, it } from 'vitest';
import { highlightCode } from './highlight';

describe('highlightCode', () => {
  it('wraps a YAML key in an hljs-attr span', () => {
    const html = highlightCode('openapi: 3.1.0', 'yaml', true);
    expect(html).toContain('class="hljs-attr"');
    expect(html).toContain('openapi');
  });

  it('wraps a JSON key in an hljs-attr span and a number in hljs-number', () => {
    const html = highlightCode('{\n  "count": 3\n}', 'json', true);
    expect(html).toContain('class="hljs-attr"');
    expect(html).toContain('class="hljs-number"');
  });

  it('wraps an XML tag name in an hljs-name span', () => {
    const html = highlightCode('<openapi><info /></openapi>', 'xml', true);
    expect(html).toContain('hljs-tag');
    expect(html).toContain('hljs-name');
  });

  it('returns escaped plain text with no hljs markup when highlighting is off', () => {
    const html = highlightCode('<a & b>', 'xml', false);
    expect(html).toBe('&lt;a &amp; b&gt;');
  });

  it('falls back to escaped plain text instead of throwing on unparseable input', () => {
    expect(() => highlightCode('not: [valid', 'yaml', true)).not.toThrow();
  });
});
