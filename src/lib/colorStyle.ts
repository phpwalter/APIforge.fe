import type { MonacoThemeId } from './colorScheme';

export type ColorStyleCategory = 'keys' | 'strings' | 'numbers' | 'literals' | 'comments';

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

export type ColorStylePrefs = Record<ColorStyleCategory, boolean>;

export const DEFAULT_COLOR_STYLE_PREFS: ColorStylePrefs = {
  keys: true,
  strings: true,
  numbers: true,
  literals: true,
  comments: true,
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

export interface ColorStyleThemeRule {
  token: string;
  foreground: string;
}

/**
 * Builds theme-rule overrides for `monaco.editor.defineTheme` (used with `inherit: true`) that
 * flatten a category's tokens to the base theme's own plain foreground when that category is
 * toggled off. A category left on gets no rule at all, so it keeps inheriting the base theme's
 * own (more specific) built-in color for that token.
 *
 * This relies on Monaco resolving a token's color by the longest matching dotted-scope prefix
 * across the merged base + override rule set: since every built-in theme already defines a more
 * specific rule for JSON's key scope than for generic strings, overriding "strings" alone never
 * shadows "keys" (and vice versa) even though `string.key.json` textually starts with `string`.
 */
export function buildColorStyleRules(baseTheme: MonacoThemeId, prefs: ColorStylePrefs): ColorStyleThemeRule[] {
  const plain = PLAIN_FOREGROUND[baseTheme];
  const rules: ColorStyleThemeRule[] = [];
  for (const category of COLOR_STYLE_CATEGORIES) {
    if (!prefs[category.value]) {
      for (const token of CATEGORY_TOKENS[category.value]) rules.push({ token, foreground: plain });
    }
  }
  return rules;
}
