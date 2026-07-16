import type { MonacoThemeId } from './colorScheme';

export type ColorStyleCategory = 'keys' | 'strings' | 'numbers' | 'literals' | 'comments';
export type ColorStyleItem = ColorStyleCategory | 'background';

export interface ColorStyleCategoryOption {
  value: ColorStyleCategory;
  label: string;
  description: string;
}

export const COLOR_STYLE_CATEGORIES: ColorStyleCategoryOption[] = [
  { value: 'keys', label: 'Keys', description: 'Object property names and YAML map keys.' },
  { value: 'strings', label: 'Strings', description: 'Quoted string values.' },
  { value: 'numbers', label: 'Numbers', description: 'Numeric values.' },
  { value: 'literals', label: 'Literals', description: 'true, false, and null.' },
  { value: 'comments', label: 'Comments', description: 'YAML comments.' },
];

export const BACKGROUND_ITEM = { value: 'background' as const, label: 'Background', description: "The editor's own background color." };

export type ColorStylePrefs = Record<ColorStyleCategory, boolean>;

export const DEFAULT_COLOR_STYLE_PREFS: ColorStylePrefs = {
  keys: true,
  strings: true,
  numbers: true,
  literals: true,
  comments: true,
};

/** A custom color per item, scoped to one base theme — `null`/absent means "use the theme's own default". */
export type ThemeColorOverrides = Partial<Record<ColorStyleItem, string>>;
/** Custom colors are kept separately per base theme, since a color tuned for a dark background often reads poorly on a light one. */
export type ColorStyleCustomColors = Record<MonacoThemeId, ThemeColorOverrides>;

export const DEFAULT_COLOR_STYLE_CUSTOM_COLORS: ColorStyleCustomColors = {
  vs: {},
  'vs-dark': {},
  'hc-black': {},
  'hc-light': {},
};

// Monaco token scopes each category covers, across both YAML's Monarch tokenizer
// (basic-languages/yaml) and JSON's built-in tokenizer (language/json) — verified against
// monaco-editor's own source, including the scope-name quirks each built-in theme uses
// (e.g. hc-black defines `string.key` while the others define `string.key.json`).
const CATEGORY_TOKENS: Record<ColorStyleCategory, string[]> = {
  keys: ['type', 'key', 'string.key.json', 'string.key'],
  strings: ['string', 'string.value.json', 'string.value'],
  numbers: ['number', 'number.hex'],
  literals: ['keyword', 'keyword.json'],
  comments: ['comment'],
};

// Each built-in theme's own default editor foreground — what an "off" category's tokens fall
// back to, so they read as plain text instead of getting their own color.
const PLAIN_FOREGROUND: Record<MonacoThemeId, string> = {
  vs: '000000',
  'vs-dark': 'D4D4D4',
  'hc-black': 'FFFFFF',
  'hc-light': '292929',
};

// A representative default color per item per base theme — verified against
// monaco-editor/esm/vs/editor/standalone/common/themes.js. Used only to pre-fill a color picker
// with "what this item currently looks like" before the user has customized it; the actual
// rendering, when no override is set, still comes from Monaco's own built-in rule for that token
// (which can differ slightly between YAML's and JSON's tokens under the same category).
export const DEFAULT_ITEM_COLOR: Record<MonacoThemeId, Record<ColorStyleItem, string>> = {
  vs: { keys: '#008080', strings: '#A31515', numbers: '#098658', literals: '#0000FF', comments: '#008000', background: '#FFFFFE' },
  'vs-dark': { keys: '#3DC9B0', strings: '#CE9178', numbers: '#B5CEA8', literals: '#569CD6', comments: '#608B4E', background: '#1E1E1E' },
  'hc-black': { keys: '#3DC9B0', strings: '#CE9178', numbers: '#FFFFFF', literals: '#569CD6', comments: '#608B4E', background: '#000000' },
  'hc-light': { keys: '#008080', strings: '#A31515', numbers: '#098658', literals: '#0000FF', comments: '#008000', background: '#FFFFFF' },
};

/** Fixed name for the derived theme both the real REST Projection editor and the Color Style settings preview define/apply — Monaco's theme is global (one active theme across every mounted editor), so sharing this id keeps them in lockstep automatically. */
export const PROJECTION_THEME_ID = 'apiforge-projection';

export interface ColorStyleThemeRule {
  token: string;
  foreground: string;
}

export interface ColorStyleTheme {
  rules: ColorStyleThemeRule[];
  colors: Record<string, string>;
}

function stripHash(hex: string): string {
  return hex.startsWith('#') ? hex.slice(1) : hex;
}

/**
 * Builds the `monaco.editor.defineTheme` rules/colors overrides (used with `inherit: true`) for a
 * base theme, given which Color Style categories are on/off and any custom colors set for that
 * base theme specifically:
 * - A category toggled off flattens its tokens to the theme's own plain foreground.
 * - A category toggled on with a custom color applies that color to its tokens.
 * - A category toggled on with no custom color adds no rule, so it keeps inheriting the base
 *   theme's own (more specific) built-in color for that token.
 * - A custom Background color becomes an `editor.background` override; no override means the
 *   base theme's own background.
 *
 * This relies on Monaco resolving a token's color by the longest matching dotted-scope prefix
 * across the merged base + override rule set: since every built-in theme already defines a more
 * specific rule for JSON's key scope than for generic strings, overriding "strings" alone never
 * shadows "keys" (and vice versa) even though `string.key.json` textually starts with `string`.
 */
export function buildColorStyleTheme(baseTheme: MonacoThemeId, prefs: ColorStylePrefs, customColors: ThemeColorOverrides): ColorStyleTheme {
  const plain = PLAIN_FOREGROUND[baseTheme];
  const rules: ColorStyleThemeRule[] = [];
  for (const category of COLOR_STYLE_CATEGORIES) {
    const custom = customColors[category.value];
    const foreground = !prefs[category.value] ? plain : custom ? stripHash(custom) : null;
    if (foreground != null) {
      for (const token of CATEGORY_TOKENS[category.value]) rules.push({ token, foreground });
    }
  }
  const colors: Record<string, string> = {};
  if (customColors.background) colors['editor.background'] = customColors.background;
  return { rules, colors };
}
