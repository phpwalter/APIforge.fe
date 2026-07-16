import { buildColorStyleTheme, DEFAULT_COLOR_STYLE_PREFS, COLOR_STYLE_CATEGORIES } from './colorStyle';

describe('COLOR_STYLE_CATEGORIES', () => {
  it('lists exactly the five categories, each exactly once', () => {
    const values = COLOR_STYLE_CATEGORIES.map((c) => c.value);
    expect(values).toEqual(['keys', 'strings', 'numbers', 'literals', 'comments']);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('buildColorStyleTheme', () => {
  it('produces no rules and no color overrides when every category is on and nothing is customized (the default)', () => {
    expect(buildColorStyleTheme('vs-dark', DEFAULT_COLOR_STYLE_PREFS, {})).toEqual({ rules: [], colors: {} });
  });

  it('flattens only the Keys scopes to the plain foreground when Keys is off, leaving other categories untouched', () => {
    const { rules } = buildColorStyleTheme('vs-dark', { ...DEFAULT_COLOR_STYLE_PREFS, keys: false }, {});
    const tokens = rules.map((r) => r.token);
    expect(tokens).toEqual(expect.arrayContaining(['type', 'key', 'string.key.json', 'string.key']));
    expect(rules.every((r) => r.foreground === 'D4D4D4')).toBe(true);
    expect(tokens).not.toContain('string');
    expect(tokens).not.toContain('number');
  });

  it('flattens the Strings scopes without touching the Keys scopes, even though string.key.json textually starts with "string"', () => {
    const { rules } = buildColorStyleTheme('vs-dark', { ...DEFAULT_COLOR_STYLE_PREFS, strings: false }, {});
    const tokens = rules.map((r) => r.token);
    expect(tokens).toEqual(expect.arrayContaining(['string', 'string.value.json', 'string.value']));
    expect(tokens).not.toContain('type');
    expect(tokens).not.toContain('string.key.json');
  });

  it('uses the correct plain foreground per base theme', () => {
    expect(buildColorStyleTheme('vs', { ...DEFAULT_COLOR_STYLE_PREFS, comments: false }, {}).rules).toEqual([
      { token: 'comment', foreground: '000000' },
    ]);
    expect(buildColorStyleTheme('hc-black', { ...DEFAULT_COLOR_STYLE_PREFS, comments: false }, {}).rules).toEqual([
      { token: 'comment', foreground: 'FFFFFF' },
    ]);
    expect(buildColorStyleTheme('hc-light', { ...DEFAULT_COLOR_STYLE_PREFS, comments: false }, {}).rules).toEqual([
      { token: 'comment', foreground: '292929' },
    ]);
  });

  it('combines overrides for every category toggled off', () => {
    const { rules } = buildColorStyleTheme(
      'vs-dark',
      { keys: false, strings: true, numbers: false, literals: true, comments: false },
      {},
    );
    const tokens = rules.map((r) => r.token).sort();
    expect(tokens).toEqual(['comment', 'key', 'number', 'number.hex', 'string.key', 'string.key.json', 'type'].sort());
  });

  it('applies a custom color (stripped of its leading #) to a category that is on', () => {
    const { rules } = buildColorStyleTheme('vs-dark', DEFAULT_COLOR_STYLE_PREFS, { strings: '#ff8800' });
    expect(rules).toEqual(
      expect.arrayContaining([
        { token: 'string', foreground: 'ff8800' },
        { token: 'string.value.json', foreground: 'ff8800' },
        { token: 'string.value', foreground: 'ff8800' },
      ]),
    );
    expect(rules).toHaveLength(3);
  });

  it('ignores a custom color for a category that is off — the plain foreground wins', () => {
    const { rules } = buildColorStyleTheme('vs-dark', { ...DEFAULT_COLOR_STYLE_PREFS, strings: false }, { strings: '#ff8800' });
    expect(rules.every((r) => r.foreground === 'D4D4D4')).toBe(true);
  });

  it('sets editor.background from a custom Background color, with the # kept', () => {
    const { colors } = buildColorStyleTheme('vs-dark', DEFAULT_COLOR_STYLE_PREFS, { background: '#101010' });
    expect(colors).toEqual({ 'editor.background': '#101010' });
  });

  it('produces no editor.background override when Background has not been customized', () => {
    const { colors } = buildColorStyleTheme('vs-dark', DEFAULT_COLOR_STYLE_PREFS, { strings: '#ff8800' });
    expect(colors).toEqual({});
  });
});
