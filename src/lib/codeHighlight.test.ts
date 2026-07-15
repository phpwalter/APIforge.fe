import { describe, expect, it } from 'vitest';
import { computeCodeLines } from './codeHighlight';

describe('computeCodeLines — yaml', () => {
  it('tokenizes a key, a string value, and a comment', () => {
    const lines = computeCodeLines('openapi: 3.1.0\n# a comment', 'yaml', true);
    expect(lines).toHaveLength(2);
    expect(lines[0].num).toBe(1);
    expect(lines[0].runs[0]).toEqual({ text: 'openapi', token: 'key' });
    expect(lines[0].runs.some((r) => r.token === 'number' && r.text === '3.1.0')).toBe(false);
    expect(lines[1].runs[0]).toMatchObject({ token: 'punct' });
  });

  it('tokenizes a standalone boolean/number as literal/number', () => {
    // A value is only recognized at the very start of a run of unmatched text — once a rule like
    // the key/colon match leaves a leading space in front of a bare scalar, the space+scalar falls
    // through to the "plain" catch-all together, matching the source `_highlightLines` behavior.
    const lines = computeCodeLines('true\n42', 'yaml', true);
    expect(lines[0].runs[0]).toEqual({ text: 'true', token: 'literal' });
    expect(lines[1].runs[0]).toEqual({ text: '42', token: 'number' });
  });
});

describe('computeCodeLines — json', () => {
  it('tokenizes an object key distinctly from a string value', () => {
    const lines = computeCodeLines('{\n  "title": "Test API"\n}', 'json', true);
    const keyRun = lines[1].runs.find((r) => r.token === 'key');
    const stringRun = lines[1].runs.find((r) => r.token === 'string');
    expect(keyRun?.text).toBe('"title"');
    expect(stringRun?.text).toBe('"Test API"');
  });
});

describe('computeCodeLines — xml', () => {
  it('tokenizes tags as key and attribute values as string', () => {
    const lines = computeCodeLines('<entry key="200">OK</entry>', 'xml', true);
    const tagRun = lines[0].runs.find((r) => r.token === 'key' && r.text === '<entry');
    const attrValueRun = lines[0].runs.find((r) => r.token === 'string');
    expect(tagRun).toBeDefined();
    expect(attrValueRun?.text).toBe('"200"');
  });
});

describe('computeCodeLines — highlighting disabled', () => {
  it('returns the raw line as a single plain run per line', () => {
    const lines = computeCodeLines('openapi: 3.1.0\nfoo: bar', 'yaml', false);
    expect(lines).toHaveLength(2);
    expect(lines[0].runs).toEqual([{ text: 'openapi: 3.1.0', token: 'plain' }]);
    expect(lines[1].runs).toEqual([{ text: 'foo: bar', token: 'plain' }]);
  });

  it('renders an empty line as a non-breaking space so it still occupies a row', () => {
    const lines = computeCodeLines('a\n\nb', 'yaml', false);
    expect(lines[1].runs).toEqual([{ text: '\u00A0', token: 'plain' }]);
  });
});
