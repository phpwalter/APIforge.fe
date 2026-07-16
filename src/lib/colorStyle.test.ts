import { buildColorStyleRules, DEFAULT_COLOR_STYLE_PREFS, COLOR_STYLE_CATEGORIES } from './colorStyle';

describe('COLOR_STYLE_CATEGORIES', () => {
  it('lists exactly the five categories, each exactly once', () => {
    const values = COLOR_STYLE_CATEGORIES.map((c) => c.value);
    expect(values).toEqual(['keys', 'strings', 'numbers', 'literals', 'comments']);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('buildColorStyleRules', () => {
  it('produces no rules at all when every category is on (the default)', () => {
    expect(buildColorStyleRules('vs-dark', DEFAULT_COLOR_STYLE_PREFS)).toEqual([]);
  });

  it('flattens only the Keys scopes to the plain foreground when Keys is off, leaving other categories untouched', () => {
    const rules = buildColorStyleRules('vs-dark', { ...DEFAULT_COLOR_STYLE_PREFS, keys: false });
    const tokens = rules.map((r) => r.token);
    expect(tokens).toEqual(expect.arrayContaining(['type', 'key', 'string.key.json', 'string.key']));
    expect(rules.every((r) => r.foreground === 'D4D4D4')).toBe(true);
    expect(tokens).not.toContain('string');
    expect(tokens).not.toContain('number');
  });

  it('flattens the Strings scopes without touching the Keys scopes, even though string.key.json textually starts with "string"', () => {
    const rules = buildColorStyleRules('vs-dark', { ...DEFAULT_COLOR_STYLE_PREFS, strings: false });
    const tokens = rules.map((r) => r.token);
    expect(tokens).toEqual(expect.arrayContaining(['string', 'string.value.json', 'string.value']));
    expect(tokens).not.toContain('type');
    expect(tokens).not.toContain('string.key.json');
  });

  it('uses the correct plain foreground per base theme', () => {
    expect(buildColorStyleRules('vs', { ...DEFAULT_COLOR_STYLE_PREFS, comments: false })).toEqual([
      { token: 'comment', foreground: '000000' },
    ]);
    expect(buildColorStyleRules('hc-black', { ...DEFAULT_COLOR_STYLE_PREFS, comments: false })).toEqual([
      { token: 'comment', foreground: 'FFFFFF' },
    ]);
    expect(buildColorStyleRules('hc-light', { ...DEFAULT_COLOR_STYLE_PREFS, comments: false })).toEqual([
      { token: 'comment', foreground: '292929' },
    ]);
  });

  it('combines overrides for every category toggled off', () => {
    const rules = buildColorStyleRules('vs-dark', {
      keys: false,
      strings: true,
      numbers: false,
      literals: true,
      comments: false,
    });
    const tokens = rules.map((r) => r.token).sort();
    expect(tokens).toEqual(['comment', 'key', 'number', 'number.hex', 'string.key', 'string.key.json', 'type'].sort());
  });
});
