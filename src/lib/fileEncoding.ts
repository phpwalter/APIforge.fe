export type CharacterEncoding = 'utf-8' | 'utf-8-bom';
export type LineEnding = 'lf' | 'crlf';

export interface FileEncodingPrefs {
  characterEncoding: CharacterEncoding;
  lineEnding: LineEnding;
  insertFinalNewline: boolean;
}

const BOM = '﻿';
const EOL: Record<LineEnding, string> = { lf: '\n', crlf: '\r\n' };

/**
 * Normalizes a generated/edited document's line endings and trailing newline to match the
 * user's File Encoding preferences. Used for both clipboard copy and file download, so both
 * respect the same setting.
 */
export function applyLineEndingPrefs(text: string, prefs: Pick<FileEncodingPrefs, 'lineEnding' | 'insertFinalNewline'>): string {
  const eol = EOL[prefs.lineEnding];
  let out = text.replace(/\r\n/g, '\n');
  if (prefs.lineEnding === 'crlf') out = out.replace(/\n/g, eol);
  if (prefs.insertFinalNewline) {
    if (!out.endsWith(eol)) out += eol;
  } else {
    while (out.endsWith(eol)) out = out.slice(0, -eol.length);
  }
  return out;
}

/**
 * Prefixes a byte-order mark for UTF-8 with BOM. Only meaningful for a downloaded file (some
 * Windows tools use it to detect UTF-8) — never applied to clipboard copy, where a leading BOM
 * character would just look like stray/garbled text once pasted.
 */
export function withByteOrderMark(text: string, encoding: CharacterEncoding): string {
  return encoding === 'utf-8-bom' ? BOM + text : text;
}
