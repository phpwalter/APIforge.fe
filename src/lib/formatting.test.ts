import { resolveIndentUnit, jsonStringifyIndentArg, resolveInsertSpaces, applyWhitespaceCleanup } from './formatting';

describe('resolveIndentUnit', () => {
  it('resolves a space unit of the configured size for spaces style', () => {
    expect(resolveIndentUnit('json', 4, 'spaces')).toEqual({ char: ' ', length: 4 });
    expect(resolveIndentUnit('yaml', 4, 'spaces')).toEqual({ char: ' ', length: 4 });
  });

  it('resolves a tab unit for JSON with tabs style', () => {
    expect(resolveIndentUnit('json', 2, 'tabs')).toEqual({ char: '\t', length: 1 });
  });

  it('forces spaces for YAML even when the preference is tabs, since tab indentation is invalid YAML', () => {
    expect(resolveIndentUnit('yaml', 2, 'tabs')).toEqual({ char: ' ', length: 2 });
    expect(resolveIndentUnit('yaml', 4, 'tabs')).toEqual({ char: ' ', length: 4 });
  });
});

describe('jsonStringifyIndentArg', () => {
  it('returns the space count for a space unit', () => {
    expect(jsonStringifyIndentArg({ char: ' ', length: 4 })).toBe(4);
  });

  it('returns a literal tab for a tab unit', () => {
    expect(jsonStringifyIndentArg({ char: '\t', length: 1 })).toBe('\t');
  });
});

describe('resolveInsertSpaces', () => {
  it('is always true for YAML regardless of the tabs/spaces preference', () => {
    expect(resolveInsertSpaces('yaml', 'spaces')).toBe(true);
    expect(resolveInsertSpaces('yaml', 'tabs')).toBe(true);
  });

  it('follows the preference for JSON', () => {
    expect(resolveInsertSpaces('json', 'spaces')).toBe(true);
    expect(resolveInsertSpaces('json', 'tabs')).toBe(false);
  });
});

describe('applyWhitespaceCleanup', () => {
  it('trims trailing spaces and tabs from every line when trimTrailingWhitespace is on', () => {
    const text = 'a: 1  \nb: 2\t\nc: 3';
    expect(applyWhitespaceCleanup(text, { trimTrailingWhitespace: true, removeBlankLines: false })).toBe(
      'a: 1\nb: 2\nc: 3',
    );
  });

  it('leaves trailing whitespace alone when trimTrailingWhitespace is off', () => {
    const text = 'a: 1  \nb: 2';
    expect(applyWhitespaceCleanup(text, { trimTrailingWhitespace: false, removeBlankLines: false })).toBe(text);
  });

  it('removes blank and whitespace-only lines when removeBlankLines is on', () => {
    const text = 'a: 1\n\nb: 2\n   \nc: 3';
    expect(applyWhitespaceCleanup(text, { trimTrailingWhitespace: false, removeBlankLines: true })).toBe(
      'a: 1\nb: 2\nc: 3',
    );
  });

  it('leaves blank lines alone when removeBlankLines is off', () => {
    const text = 'a: 1\n\nb: 2';
    expect(applyWhitespaceCleanup(text, { trimTrailingWhitespace: false, removeBlankLines: false })).toBe(text);
  });

  it('applies both cleanups together', () => {
    const text = 'a: 1  \n\nb: 2\t\n   \nc: 3';
    expect(applyWhitespaceCleanup(text, { trimTrailingWhitespace: true, removeBlankLines: true })).toBe(
      'a: 1\nb: 2\nc: 3',
    );
  });

  it('is a no-op on already-clean text', () => {
    const text = 'a: 1\nb: 2\nc: 3';
    expect(applyWhitespaceCleanup(text, { trimTrailingWhitespace: true, removeBlankLines: true })).toBe(text);
  });
});
