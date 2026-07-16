import { resolveIndentUnit, jsonStringifyIndentArg, resolveInsertSpaces } from './formatting';

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
