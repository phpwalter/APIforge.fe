import type { RestProjectionFormat } from '../types/ui';

export interface OutlineNode {
  key: string;
  label: string;
  /** 1-based Monaco line number this node jumps to, or null if it couldn't be located in the current text (e.g. mid hand-edit). */
  line: number | null;
  children?: OutlineNode[];
}

/** The literal indent unit the text was actually generated with — must match the Formatting preferences used to produce it, so line lookups land on the right row. */
export interface OutlineIndentUnit {
  char: ' ' | '\t';
  /** Indent characters per nesting level (e.g. 2 or 4 for spaces; always 1 for tabs). */
  length: number;
}

export interface BuildRestProjectionOutlineParams {
  text: string;
  format: RestProjectionFormat;
  indentUnit: OutlineIndentUnit;
  /** Unique tag names, in first-seen order across endpoints. */
  tags: string[];
  /** Unique endpoint paths, in first-seen order — one entry per path even if it has multiple methods. */
  paths: string[];
  /** Non-empty operationIds, in endpoint order. */
  operationIds: string[];
  /** Server URLs, in order (already filtered non-empty). */
  servers: string[];
  /** Schema names, in order. */
  schemaNames: string[];
  /** Security scheme names, in order. */
  securitySchemeNames: string[];
}

interface Bounds {
  start: number;
  end: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** General and Components start expanded (they're small, fixed-shape groups); every other group starts collapsed. */
export function isOutlineGroupDefaultExpanded(key: string): boolean {
  return key === 'general' || key === 'components';
}

/** De-duplicates, dropping falsy entries, keeping first-seen order. */
export function uniqueInOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

/** Root object properties sit at indent level 0 in YAML, level 1 in pretty-printed JSON (inside the outer `{`). */
function rootIndent(format: RestProjectionFormat, unit: OutlineIndentUnit): number {
  return format === 'json' ? unit.length : 0;
}

// Matches a `key:` line at exactly `count` indent characters — either a nested block header
// (colon at end of line) or a scalar with an inline value (colon followed by the value).
function keyLineRegex(format: RestProjectionFormat, key: string, count: number, unit: OutlineIndentUnit): RegExp {
  const esc = escapeRegExp(key);
  const indentChar = escapeRegExp(unit.char);
  return format === 'json'
    ? new RegExp(`^${indentChar}{${count}}"${esc}":(\\s|$)`)
    : new RegExp(`^${indentChar}{${count}}["']?${esc}["']?:(\\s|$)`);
}

/** Finds a `key:` line within [from, to) at exactly `count` indent characters, and its block's end (next line at <= that indent). */
function findKeyBounds(
  lines: string[],
  from: number,
  to: number,
  format: RestProjectionFormat,
  key: string,
  count: number,
  unit: OutlineIndentUnit,
): Bounds | null {
  const re = keyLineRegex(format, key, count, unit);
  let start = -1;
  for (let i = from; i < to; i++) {
    if (re.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start === -1) return null;
  const indentChar = escapeRegExp(unit.char);
  const endRe = new RegExp(`^${indentChar}{0,${count}}\\S`);
  let end = to;
  for (let i = start + 1; i < to; i++) {
    if (endRe.test(lines[i])) {
      end = i;
      break;
    }
  }
  return { start, end };
}

/** 1-based line number of a `key:` line within [from, to) at exactly `count` indent characters, or null. */
function findKeyLine(
  lines: string[],
  from: number,
  to: number,
  format: RestProjectionFormat,
  key: string,
  count: number,
  unit: OutlineIndentUnit,
): number | null {
  const re = keyLineRegex(format, key, count, unit);
  for (let i = from; i < to; i++) {
    if (re.test(lines[i])) return i + 1;
  }
  return null;
}

/** First line in [from, to) that both looks like a `url:`/`"url":` entry and contains this exact value. */
function findUrlLine(lines: string[], from: number, to: number, format: RestProjectionFormat, value: string): number | null {
  const marker = format === 'json' ? '"url":' : 'url:';
  const esc = escapeRegExp(value);
  const re = new RegExp(`${escapeRegExp(marker)}\\s*["']?${esc}["']?\\s*,?\\s*$`);
  for (let i = from; i < to; i++) {
    if (re.test(lines[i])) return i + 1;
  }
  return null;
}

/** First line anywhere that's a standalone list/array entry equal to this exact value (used for tags, which repeat per-operation). */
function findListItemLine(lines: string[], format: RestProjectionFormat, value: string): number | null {
  const esc = escapeRegExp(value);
  const re = format === 'json' ? new RegExp(`^\\s*"${esc}"\\s*,?\\s*$`) : new RegExp(`^\\s*-\\s*["']?${esc}["']?\\s*$`);
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) return i + 1;
  }
  return null;
}

/** First line anywhere matching `operationId: <value>` / `"operationId": "<value>"` exactly. */
function findOperationIdLine(lines: string[], format: RestProjectionFormat, value: string): number | null {
  const esc = escapeRegExp(value);
  const re =
    format === 'json'
      ? new RegExp(`^\\s*"operationId":\\s*"${esc}"\\s*,?\\s*$`)
      : new RegExp(`^\\s*operationId:\\s*["']?${esc}["']?\\s*$`);
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) return i + 1;
  }
  return null;
}

/**
 * Builds the REST Projection document outline (General/Tags/Paths/Operation ID/Servers/
 * Components/Security) shown in the left subpanel, with each leaf's Monaco line resolved by
 * scanning the currently-displayed text. Best-effort: a leaf whose line can't be found (e.g. the
 * user hand-edited the document into a different shape) gets `line: null` and is just non-clickable.
 */
export function buildRestProjectionOutline(params: BuildRestProjectionOutlineParams): OutlineNode[] {
  const { text, format, indentUnit: unit, tags, paths, operationIds, servers, schemaNames, securitySchemeNames } = params;
  const lines = text.split('\n');
  const indent0 = rootIndent(format, unit);
  const indent1 = indent0 + unit.length;
  const indent2 = indent0 + unit.length * 2;

  const general: OutlineNode = {
    key: 'general',
    label: 'General',
    line: null,
    children: [
      { key: 'general-info', label: 'info', line: findKeyLine(lines, 0, lines.length, format, 'info', indent0, unit) },
      { key: 'general-openapi', label: 'openapi', line: findKeyLine(lines, 0, lines.length, format, 'openapi', indent0, unit) },
    ],
  };

  const tagsNode: OutlineNode = {
    key: 'tags',
    label: 'Tags',
    line: null,
    children: tags.map((tag, i) => ({ key: `tag-${i}-${tag}`, label: tag, line: findListItemLine(lines, format, tag) })),
  };

  const pathsBounds = findKeyBounds(lines, 0, lines.length, format, 'paths', indent0, unit);
  const pathsNode: OutlineNode = {
    key: 'paths',
    label: 'Paths',
    line: null,
    children: paths.map((path, i) => ({
      key: `path-${i}`,
      label: path,
      line: pathsBounds ? findKeyLine(lines, pathsBounds.start + 1, pathsBounds.end, format, path, indent1, unit) : null,
    })),
  };

  const operationIdNode: OutlineNode = {
    key: 'operationId',
    label: 'Operation ID',
    line: null,
    children: operationIds.map((id, i) => ({ key: `opid-${i}-${id}`, label: id, line: findOperationIdLine(lines, format, id) })),
  };

  const serversBounds = findKeyBounds(lines, 0, lines.length, format, 'servers', indent0, unit);
  let serverCursor = serversBounds ? serversBounds.start + 1 : 0;
  const serversNode: OutlineNode = {
    key: 'servers',
    label: 'Servers',
    line: null,
    children: servers.map((url, i) => {
      const line = serversBounds ? findUrlLine(lines, serverCursor, serversBounds.end, format, url) : null;
      if (line != null) serverCursor = line; // advance past this match so duplicate/similar URLs pair up in order
      return { key: `server-${i}`, label: url, line };
    }),
  };

  const componentsBounds = findKeyBounds(lines, 0, lines.length, format, 'components', indent0, unit);
  const schemasBounds = componentsBounds
    ? findKeyBounds(lines, componentsBounds.start + 1, componentsBounds.end, format, 'schemas', indent1, unit)
    : null;
  const securitySchemesBounds = componentsBounds
    ? findKeyBounds(lines, componentsBounds.start + 1, componentsBounds.end, format, 'securitySchemes', indent1, unit)
    : null;

  const schemasNode: OutlineNode = {
    key: 'schemas',
    label: 'Schemas',
    line: null,
    children: schemaNames.map((name, i) => ({
      key: `schema-${i}`,
      label: name,
      line: schemasBounds ? findKeyLine(lines, schemasBounds.start + 1, schemasBounds.end, format, name, indent2, unit) : null,
    })),
  };

  const securitySchemesNode: OutlineNode = {
    key: 'securitySchemes',
    label: 'Security Schemes',
    line: null,
    children: securitySchemeNames.map((name, i) => ({
      key: `securityScheme-${i}`,
      label: name,
      line: securitySchemesBounds
        ? findKeyLine(lines, securitySchemesBounds.start + 1, securitySchemesBounds.end, format, name, indent2, unit)
        : null,
    })),
  };

  const componentsNode: OutlineNode = {
    key: 'components',
    label: 'Components',
    line: null,
    children: [schemasNode, securitySchemesNode],
  };

  // The generated document has no document-level `security:` requirement (only per-operation) —
  // the closest real, navigable target is where the security schemes themselves are defined.
  const securityNode: OutlineNode = {
    key: 'security',
    label: 'Security',
    line: securitySchemesBounds ? securitySchemesBounds.start + 1 : null,
  };

  return [general, tagsNode, pathsNode, operationIdNode, serversNode, componentsNode, securityNode];
}
