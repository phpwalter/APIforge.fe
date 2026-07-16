import type { RestProjectionFormat } from '../types/ui';
import type { OutlineIndentUnit } from './restProjectionOutline';

export type IndentSize = 2 | 4;
export type IndentStyle = 'spaces' | 'tabs';

/**
 * YAML indentation must be spaces — tabs are invalid there per the YAML spec — so Indent Style:
 * Tabs only takes effect for JSON (and, correspondingly, Monaco's own typing behavior below).
 */
export function resolveIndentUnit(format: RestProjectionFormat, indentSize: IndentSize, indentStyle: IndentStyle): OutlineIndentUnit {
  if (format === 'yaml' || indentStyle === 'spaces') return { char: ' ', length: indentSize };
  return { char: '\t', length: 1 };
}

/** The argument `JSON.stringify`'s third parameter expects for a given resolved indent unit. */
export function jsonStringifyIndentArg(unit: OutlineIndentUnit): string | number {
  return unit.char === '\t' ? '\t' : unit.length;
}

/** Whether Monaco should insert spaces (vs. a literal tab) when Tab is pressed, for this format + preference. */
export function resolveInsertSpaces(format: RestProjectionFormat, indentStyle: IndentStyle): boolean {
  return format === 'yaml' || indentStyle === 'spaces';
}
