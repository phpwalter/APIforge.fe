import { resolveMonacoTheme, COLOR_SCHEME_OPTIONS } from './colorScheme';

describe('resolveMonacoTheme', () => {
  it('follows the app theme when set to auto', () => {
    expect(resolveMonacoTheme('auto', 'dark')).toBe('vs-dark');
    expect(resolveMonacoTheme('auto', 'light')).toBe('vs');
  });

  it('returns the explicit scheme regardless of app theme when not auto', () => {
    expect(resolveMonacoTheme('vs', 'dark')).toBe('vs');
    expect(resolveMonacoTheme('vs-dark', 'light')).toBe('vs-dark');
    expect(resolveMonacoTheme('hc-black', 'light')).toBe('hc-black');
    expect(resolveMonacoTheme('hc-light', 'dark')).toBe('hc-light');
  });
});

describe('COLOR_SCHEME_OPTIONS', () => {
  it('lists auto plus all four Monaco built-in themes, each exactly once', () => {
    const values = COLOR_SCHEME_OPTIONS.map((o) => o.value);
    expect(values).toEqual(['auto', 'vs', 'vs-dark', 'hc-black', 'hc-light']);
    expect(new Set(values).size).toBe(values.length);
  });
});
