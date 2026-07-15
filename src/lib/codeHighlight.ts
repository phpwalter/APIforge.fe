import type { RestProjectionFormat } from '../types/ui';

export type HighlightToken = 'key' | 'string' | 'number' | 'literal' | 'punct' | 'plain';

export interface HighlightRun {
  text: string;
  token: HighlightToken;
}

export interface HighlightLine {
  num: number;
  runs: HighlightRun[];
}

interface Rule {
  re: RegExp;
  token: HighlightToken;
}

// Lightweight, regex-based line tokenizer shared by the YAML/JSON/XML REST Projection views —
// not a full grammar, just enough to color keys, strings, numbers/literals, tags, and punctuation
// distinctly, matching the design handoff's `_highlightLines`.
const RULES: Record<RestProjectionFormat, Rule[]> = {
  json: [
    { re: /^"(?:[^"\\]|\\.)*"(?=\s*:)/, token: 'key' },
    { re: /^"(?:[^"\\]|\\.)*"/, token: 'string' },
    { re: /^-?\d+\.?\d*(?:[eE][+-]?\d+)?/, token: 'number' },
    { re: /^(?:true|false|null)\b/, token: 'literal' },
    { re: /^[{}[\],:]/, token: 'punct' },
  ],
  xml: [
    { re: /^<!--[\s\S]*?-->/, token: 'punct' },
    { re: /^<\?[^>]*\?>/, token: 'punct' },
    { re: /^<\/?[A-Za-z_][\w.-]*/, token: 'key' },
    { re: /^[A-Za-z_][\w.-]*(?==")/, token: 'literal' },
    { re: /^"(?:[^"\\]|\\.)*"/, token: 'string' },
    { re: /^\/?>/, token: 'punct' },
    { re: /^=/, token: 'punct' },
  ],
  yaml: [
    { re: /^#.*$/, token: 'punct' },
    { re: /^-(?=\s|$)/, token: 'punct' },
    { re: /^(['"])(?:(?!\1).)*\1(?=\s*:)/, token: 'key' },
    { re: /^[A-Za-z_][\w.-]*(?=\s*:(?:\s|$))/, token: 'key' },
    { re: /^:/, token: 'punct' },
    { re: /^'(?:[^']|'')*'/, token: 'string' },
    { re: /^"(?:[^"\\]|\\.)*"/, token: 'string' },
    { re: /^(?:true|false|null)\b/, token: 'literal' },
    { re: /^-?\d+\.?\d*\b/, token: 'number' },
    { re: /^[{}[\],]/, token: 'punct' },
  ],
};

const FALLBACK_RUN = /^[^:,[\]{}"'#=<>/-]+/;

function highlightLine(line: string, rules: Rule[]): HighlightRun[] {
  const runs: HighlightRun[] = [];
  let rest = line;
  let guard = 0;
  while (rest.length && guard < 3000) {
    guard++;
    let matched: HighlightRun | null = null;
    for (const rule of rules) {
      const m = rest.match(rule.re);
      if (m && m[0].length) {
        matched = { text: m[0], token: rule.token };
        break;
      }
    }
    if (!matched) {
      const m = rest.match(FALLBACK_RUN);
      matched = { text: m && m[0].length ? m[0] : rest[0], token: 'plain' };
    }
    runs.push(matched);
    rest = rest.slice(matched.text.length);
  }
  // A non-breaking space keeps an empty line's row from collapsing, matching the source `_highlightLines`.
  if (!runs.length) runs.push({ text: '\u00A0', token: 'plain' });
  return runs;
}

/** Splits `text` into gutter-numbered, tokenized lines. Falls back to unhighlighted plain runs when `highlighting` is off. */
export function computeCodeLines(text: string, format: RestProjectionFormat, highlighting: boolean): HighlightLine[] {
  const lines = text.split('\n');
  const rules = RULES[format];
  return lines.map((line, i) => ({
    num: i + 1,
    runs: highlighting ? highlightLine(line, rules) : [{ text: line === '' ? '\u00A0' : line, token: 'plain' }],
  }));
}
