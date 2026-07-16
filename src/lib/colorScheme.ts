/** A Monaco built-in theme id, or 'auto' to follow the app's own Day/Night theme. */
export type ColorScheme = 'auto' | 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';

/** The concrete Monaco theme id a ColorScheme resolves to — never 'auto'. */
export type MonacoThemeId = 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';

export const MONACO_THEME_IDS: MonacoThemeId[] = ['vs', 'vs-dark', 'hc-black', 'hc-light'];

export interface ColorSchemeOption {
  value: ColorScheme;
  label: string;
  description: string;
}

export const COLOR_SCHEME_OPTIONS: ColorSchemeOption[] = [
  { value: 'auto', label: 'Auto', description: "Follows the app's Day/Night theme (Settings → Appearance)." },
  { value: 'vs', label: 'Light', description: "Monaco's standard light theme." },
  { value: 'vs-dark', label: 'Dark', description: "Monaco's standard dark theme." },
  { value: 'hc-black', label: 'High Contrast Dark', description: 'Maximum-contrast dark theme for accessibility.' },
  { value: 'hc-light', label: 'High Contrast Light', description: 'Maximum-contrast light theme for accessibility.' },
];

/** Resolves the Color Scheme preference to an actual Monaco theme id — 'auto' follows the app's own Day/Night theme. */
export function resolveMonacoTheme(colorScheme: ColorScheme, appTheme: 'dark' | 'light'): MonacoThemeId {
  if (colorScheme === 'auto') return appTheme === 'dark' ? 'vs-dark' : 'vs';
  return colorScheme;
}
