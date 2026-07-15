import { load as loadYaml } from 'js-yaml';
import type {
  Endpoint,
  HeaderParam,
  HttpMethod,
  Param,
  ParamLocation,
  ResponseEntry,
  Schema,
  SchemaField,
  SchemaFieldType,
} from '../types/spec';

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'].map((m) =>
  m.toUpperCase(),
) as HttpMethod[];

export class OpenApiImportError extends Error {}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// Minimal shape we actually read — the rest of a real OpenAPI document
// passes through untouched, we just don't look at it yet.
interface RawOperation {
  summary?: string;
  operationId?: string;
  tags?: string[];
  security?: Record<string, unknown>[];
  parameters?: RawParameter[];
  requestBody?: { description?: string };
  responses?: Record<string, RawResponse>;
}

interface RawParameter {
  name?: string;
  in?: string;
  required?: boolean;
  schema?: { nullable?: boolean; example?: unknown };
}

interface RawResponseHeader {
  required?: boolean;
  schema?: { nullable?: boolean; example?: unknown };
}

interface RawResponseSchema {
  $ref?: string;
  type?: string;
  items?: { $ref?: string };
}

interface RawResponse {
  description?: string;
  headers?: Record<string, RawResponseHeader>;
  content?: Record<string, { schema?: RawResponseSchema }>;
}

interface RawPathItem extends Record<string, unknown> {
  parameters?: RawParameter[];
}

interface RawSchemaProperty {
  type?: string;
  format?: string;
  example?: unknown;
  nullable?: boolean;
  $ref?: string;
  /** Array item schema — recursively shaped, so an array of inline nested objects is supported too. */
  items?: RawSchemaProperty;
  /** Inline nested object properties (when type is 'object' without a $ref). */
  properties?: Record<string, RawSchemaProperty>;
  /** Required-property names scoped to this level's own `properties`. */
  required?: string[];
}

interface RawSchema {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, RawSchemaProperty>;
  required?: string[];
  'x-apiforge-primitive'?: string;
}

interface RawDocument {
  openapi?: string;
  swagger?: string;
  info?: { title?: string; version?: string };
  paths?: Record<string, RawPathItem>;
  security?: Record<string, unknown>[];
  components?: { schemas?: Record<string, RawSchema> };
}

export interface ParsedOpenApiProject {
  title: string;
  version: string;
  openapiVersion: string;
  endpoints: Endpoint[];
  schemas: Schema[];
}

function isYamlFile(filename: string): boolean {
  return /\.ya?ml$/i.test(filename);
}

function isXmlFile(filename: string): boolean {
  return /\.xml$/i.test(filename);
}

function looksLikeXml(trimmedText: string): boolean {
  return /^<\?xml/i.test(trimmedText) || /^<openapi[\s>]/i.test(trimmedText);
}

// Not a standard OpenAPI serialization (there isn't one) — this is APIforge's own
// lossless object<->XML mapping, produced by this app's XML export. An element's
// `key` attribute (when present) is its true object key — used when the key isn't
// a valid XML name — and sibling elements sharing a key become an array.
function coerceXmlScalar(text: string): unknown {
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (/^-?\d+$/.test(text)) return parseInt(text, 10);
  if (/^-?\d*\.\d+$/.test(text)) return parseFloat(text);
  return text;
}

function xmlElementToValue(el: Element): unknown {
  const children = [...el.children];
  if (!children.length) {
    const text = el.textContent ?? '';
    return text === '' ? null : coerceXmlScalar(text);
  }
  const groups = new Map<string, Element[]>();
  const order: string[] = [];
  children.forEach((c) => {
    const key = c.getAttribute('key') || c.tagName;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(c);
  });
  const obj: Record<string, unknown> = {};
  order.forEach((key) => {
    const els = groups.get(key)!;
    obj[key] = els.length > 1 ? els.map(xmlElementToValue) : xmlElementToValue(els[0]);
  });
  return obj;
}

function xmlToDoc(xmlText: string): RawDocument {
  const parsed = new DOMParser().parseFromString(xmlText, 'text/xml');
  if (parsed.querySelector('parsererror')) {
    throw new Error('Invalid XML document');
  }
  return xmlElementToValue(parsed.documentElement) as RawDocument;
}

function parseRaw(text: string, filename: string): RawDocument {
  const trimmed = text.trim();
  if (isXmlFile(filename) || looksLikeXml(trimmed)) {
    try {
      return xmlToDoc(trimmed);
    } catch (err) {
      throw new OpenApiImportError(
        `Could not parse "${filename}" as XML: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  const looksYaml = isYamlFile(filename) || (!filename.toLowerCase().endsWith('.json') && !trimmed.startsWith('{'));
  try {
    if (looksYaml) {
      const parsed = loadYaml(text);
      if (parsed && typeof parsed === 'object') return parsed as RawDocument;
      throw new Error('YAML did not parse to an object');
    }
    return JSON.parse(text) as RawDocument;
  } catch (err) {
    // Fall back to trying the other format once, in case the extension lied.
    try {
      return looksYaml ? (JSON.parse(text) as RawDocument) : ((loadYaml(text) as RawDocument) ?? {});
    } catch {
      throw new OpenApiImportError(
        `Could not parse "${filename}" as JSON or YAML: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

function securityNamesFrom(security: Record<string, unknown>[] | undefined): string[] {
  if (!security) return [];
  const names = new Set<string>();
  security.forEach((req) => Object.keys(req ?? {}).forEach((name) => names.add(name)));
  return [...names];
}

function refNameFromPointer(ref: string | undefined): string | undefined {
  const m = ref ? /^#\/components\/schemas\/(.+)$/.exec(ref) : null;
  return m ? m[1] : undefined;
}

function buildResponseHeaders(headers: Record<string, RawResponseHeader> | undefined): HeaderParam[] {
  return Object.entries(headers ?? {}).map(([name, h]) => ({
    id: makeId('hd'),
    name,
    required: !!h?.required,
    nullable: !!h?.schema?.nullable,
    example: h?.schema?.example !== undefined ? String(h.schema.example) : '',
  }));
}

function responseBody(content: Record<string, { schema?: RawResponseSchema }> | undefined): {
  schema: string;
  schemaIsArray: boolean;
} {
  const bodySchema = content ? Object.values(content)[0]?.schema : undefined;
  if (!bodySchema) return { schema: '', schemaIsArray: false };
  if (bodySchema.type === 'array' && bodySchema.items?.$ref) {
    return { schema: refNameFromPointer(bodySchema.items.$ref) ?? '', schemaIsArray: true };
  }
  if (bodySchema.$ref) {
    return { schema: refNameFromPointer(bodySchema.$ref) ?? '', schemaIsArray: false };
  }
  return { schema: '', schemaIsArray: false };
}

function buildParamsAndHeaders(
  pathParams: RawParameter[],
  opParams: RawParameter[],
): { params: Param[]; headers: HeaderParam[] } {
  // Operation-level parameters override path-level ones with the same name+location.
  const merged = new Map<string, RawParameter>();
  const all = [...(Array.isArray(pathParams) ? pathParams : []), ...(Array.isArray(opParams) ? opParams : [])];
  all.forEach((p) => {
    if (!p?.name || !p.in) return;
    merged.set(`${p.in}:${p.name}`, p);
  });

  const params: Param[] = [];
  const headers: HeaderParam[] = [];
  merged.forEach((p) => {
    const nullable = !!p.schema?.nullable;
    const example = p.schema?.example !== undefined ? String(p.schema.example) : '';
    if (p.in === 'header') {
      headers.push({ id: makeId('hd'), name: p.name!, required: !!p.required, nullable, example });
    } else {
      const loc: ParamLocation = p.in === 'path' ? 'path' : p.in === 'cookie' ? 'cookie' : 'query';
      params.push({ id: makeId('pm'), name: p.name!, in: loc, required: !!p.required, nullable, example });
    }
  });
  return { params, headers };
}

export function parseOpenApiDocument(text: string, filename: string): ParsedOpenApiProject {
  const doc = parseRaw(text, filename);

  if (!doc.openapi && !doc.swagger) {
    throw new OpenApiImportError('This file has no "openapi" or "swagger" version field — is it an OpenAPI document?');
  }
  if (!doc.paths || Object.keys(doc.paths).length === 0) {
    throw new OpenApiImportError('This document has no paths — nothing to import.');
  }

  const endpoints: Endpoint[] = [];

  for (const [path, rawPathItem] of Object.entries(doc.paths)) {
    const pathItem = rawPathItem ?? {};
    const pathParams = pathItem.parameters ?? [];
    for (const methodKey of HTTP_METHODS) {
      const raw = pathItem[methodKey.toLowerCase()] as RawOperation | undefined;
      if (!raw) continue;

      const { params, headers } = buildParamsAndHeaders(pathParams, raw.parameters ?? []);
      const responses: ResponseEntry[] = Object.entries(raw.responses ?? {}).map(([code, r]) => ({
        id: makeId('res'),
        code,
        description: r?.description ?? '',
        headers: buildResponseHeaders(r?.headers),
        contentTypes: r?.content ? Object.keys(r.content) : ['application/json'],
        ...responseBody(r?.content),
      }));

      endpoints.push({
        id: makeId('ep'),
        path,
        method: methodKey,
        summary: raw.summary ?? '',
        operationId: raw.operationId ?? '',
        tags: raw.tags ?? [],
        security: securityNamesFrom(raw.security ?? doc.security),
        params,
        headers,
        requestBodyEnabled: !!raw.requestBody,
        requestBodyDescription: raw.requestBody?.description ?? '',
        responses: responses.length
          ? responses
          : [
              {
                id: makeId('res'),
                code: '200',
                description: 'OK',
                headers: [],
                contentTypes: ['application/json'],
                schema: '',
                schemaIsArray: false,
              },
            ],
      });
    }
  }

  if (endpoints.length === 0) {
    throw new OpenApiImportError('No operations (GET/POST/PUT/PATCH/DELETE/…) were found under any path.');
  }

  const JSON_SCHEMA_TYPES = new Set(['string', 'integer', 'number', 'boolean', 'array', 'object']);
  const toFieldType = (t: string | undefined): SchemaFieldType =>
    (t && JSON_SCHEMA_TYPES.has(t) ? t : 'string') as SchemaFieldType;

  const rawSchemaEntries = Object.entries(doc.components?.schemas ?? {});
  // First pass: each schema's own effective type, so a $ref property pointing at a scalar
  // schema (e.g. a "Uuid" wrapper) can carry that scalar's real type instead of a placeholder.
  const schemaEffectiveType = new Map<string, SchemaFieldType>();
  rawSchemaEntries.forEach(([name, s]) => {
    const isScalar = s?.type !== undefined && s.type !== 'object';
    schemaEffectiveType.set(name, isScalar ? toFieldType(s!.type) : 'object');
  });

  // Recursively flattens a level of `properties` into the depth-annotated field list our own
  // model uses — an inline nested object, or an array whose items are an inline nested object,
  // pushes a container field followed immediately by its children one depth deeper.
  function propertiesToFields(
    properties: Record<string, RawSchemaProperty> | undefined,
    requiredNames: Set<string>,
    depth: number,
  ): SchemaField[] {
    const fields: SchemaField[] = [];
    Object.entries(properties ?? {}).forEach(([propName, p]) => {
      const base = {
        id: makeId('sf'),
        name: propName,
        required: requiredNames.has(propName),
        nullable: !!p?.nullable,
        depth,
        example: p?.example !== undefined ? String(p.example) : '',
      };
      const directRef = refNameFromPointer(p?.$ref);
      if (directRef) {
        fields.push({ ...base, kind: 'ref', ref: directRef, type: schemaEffectiveType.get(directRef) ?? 'object' });
        return;
      }
      if (p?.type === 'array' && p.items) {
        const itemsRef = refNameFromPointer(p.items.$ref);
        if (itemsRef) {
          fields.push({ ...base, kind: 'custom', type: 'array', itemsRef, itemsType: 'object' });
          return;
        }
        if (p.items.type === 'object' && p.items.properties) {
          fields.push({ ...base, kind: 'custom', type: 'array' });
          fields.push(...propertiesToFields(p.items.properties, new Set(p.items.required ?? []), depth + 1));
          return;
        }
        fields.push({ ...base, kind: 'custom', type: 'array', itemsType: toFieldType(p.items.type) });
        return;
      }
      if (p?.type === 'object' && p.properties) {
        fields.push({ ...base, kind: 'custom', type: 'object' });
        fields.push(...propertiesToFields(p.properties, new Set(p.required ?? []), depth + 1));
        return;
      }
      fields.push({ ...base, kind: 'custom', type: toFieldType(p?.type), format: p?.format });
    });
    return fields;
  }

  const schemas: Schema[] = rawSchemaEntries.map(([name, s]) => {
    const isScalar = s?.type !== undefined && s.type !== 'object';
    if (isScalar) {
      return {
        id: makeId('sc'),
        name,
        scalar: true,
        fields: [],
        contentTypes: ['application/json'],
        scalarType: toFieldType(s.type),
        scalarFormat: s.format,
        scalarDescription: s.description ?? '',
        scalarPrimitiveKey: s['x-apiforge-primitive'],
      };
    }
    const fields = propertiesToFields(s?.properties, new Set(s?.required ?? []), 0);
    return { id: makeId('sc'), name, fields, contentTypes: ['application/json'] };
  });

  return {
    title: doc.info?.title ?? 'Untitled API',
    version: doc.info?.version ?? '1.0.0',
    openapiVersion: doc.openapi ?? doc.swagger ?? '3.1.0',
    endpoints,
    schemas,
  };
}
