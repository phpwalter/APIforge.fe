import type { Schema, SchemaField, SchemaFieldType } from '../types/spec';
import { findPrimitive } from './primitives';
import { fieldsToTree, type SchemaFieldTreeNode } from './schemaTree';

/** Generic placeholder value for a bare JSON type, used when no real example is available. */
export function scalarPlaceholder(t: SchemaFieldType | undefined): unknown {
  switch (t) {
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return true;
    case 'object':
      return {};
    case 'array':
      return [];
    default:
      return 'string';
  }
}

/** Example value for a scalar schema: prefers its wrapped primitive's curated example, else a type placeholder. */
export function scalarSchemaExample(schema: Schema): unknown {
  if (schema.scalarPrimitiveKey) {
    const p = findPrimitive(schema.scalarPrimitiveKey);
    if (p && p.example !== undefined) return p.example;
  }
  return scalarPlaceholder(schema.scalarType);
}

/** Best-effort example value for a single field row: own example, else primitive/ref example, else a type placeholder. */
function exampleValueForRow(f: SchemaField, schemas: Schema[], depth: number): unknown {
  if (depth > 3) return null;
  if (f.example !== undefined && f.example !== '') {
    if (f.type === 'integer' || f.type === 'number') {
      const n = Number(f.example);
      return isNaN(n) ? f.example : n;
    }
    if (f.type === 'boolean') return String(f.example) === 'true';
    return f.example;
  }
  if (f.kind === 'primitive') {
    const p = findPrimitive(f.primitiveKey);
    if (p && p.example !== undefined) return p.example;
    return f.nullable ? null : scalarPlaceholder(f.type);
  }
  if (f.kind === 'ref' && f.type !== 'array') {
    const refSchema = schemas.find((s) => s.name === f.ref);
    if (refSchema) {
      if (refSchema.scalar) return scalarSchemaExample(refSchema);
      const tree = fieldsToTree(refSchema.fields);
      const o: Record<string, unknown> = {};
      tree.forEach((n) => {
        if (n.name) o[n.name] = exampleValueForNode(n, schemas, depth + 1);
      });
      return o;
    }
    return {};
  }
  if (f.type === 'array') {
    const itemsRef = f.kind === 'custom' ? f.itemsRef : undefined;
    if (itemsRef) {
      const refSchema = schemas.find((s) => s.name === itemsRef);
      if (refSchema) {
        if (refSchema.scalar) return [scalarSchemaExample(refSchema)];
        const tree = fieldsToTree(refSchema.fields);
        const o: Record<string, unknown> = {};
        tree.forEach((n) => {
          if (n.name) o[n.name] = exampleValueForNode(n, schemas, depth + 1);
        });
        return [o];
      }
      return [];
    }
    const itemsType = f.kind === 'custom' ? f.itemsType : undefined;
    return [scalarPlaceholder(itemsType || 'string')];
  }
  return f.nullable ? null : scalarPlaceholder(f.type);
}

/** Example value for a node in the nested field tree: recurses into children, else delegates to the leaf logic above. */
function exampleValueForNode(node: SchemaFieldTreeNode, schemas: Schema[], depth = 0): unknown {
  if (depth > 6) return null;
  if (node.children.length) {
    const obj: Record<string, unknown> = {};
    node.children.forEach((c) => {
      if (c.name) obj[c.name] = exampleValueForNode(c, schemas, depth + 1);
    });
    return node.type === 'array' ? [obj] : obj;
  }
  return exampleValueForRow(node, schemas, depth);
}

/** Builds a live plain-JS example value from a schema's current fields (or its scalar type). */
export function fieldsToExampleValue(schema: Schema, schemas: Schema[]): unknown {
  if (schema.scalar) return scalarSchemaExample(schema);
  const tree = fieldsToTree(schema.fields);
  const obj: Record<string, unknown> = {};
  tree.forEach((node) => {
    if (node.name) obj[node.name] = exampleValueForNode(node, schemas);
  });
  return obj;
}

function xmlEscape(s: unknown): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function valueToXml(tag: string, val: unknown): string {
  if (val === null || val === undefined) return `<${tag}/>`;
  if (Array.isArray(val)) return val.map((v) => valueToXml(tag, v)).join('\n');
  if (typeof val === 'object') {
    const inner = Object.keys(val as object)
      .map((k) => valueToXml(k, (val as Record<string, unknown>)[k]))
      .join('\n  ');
    return `<${tag}>\n  ${inner}\n</${tag}>`;
  }
  return `<${tag}>${xmlEscape(val)}</${tag}>`;
}

/** Formats a parsed example value for a target content type (pretty JSON, simple XML, or plain text). */
export function formatExampleForContentType(value: unknown, contentType: string, rootName: string): string {
  if (/xml/i.test(contentType)) {
    const root = (rootName || 'root').replace(/[^A-Za-z0-9_]/g, '') || 'root';
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const inner = Object.keys(value as object)
        .map((k) => valueToXml(k, (value as Record<string, unknown>)[k]))
        .join('\n  ');
      return `<${root}>\n  ${inner}\n</${root}>`;
    }
    return valueToXml(root, value);
  }
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

/** Resolves the best available example-hint text for a field row: own example, else the example of the primitive it's backed by (directly, or via a $ref to a primitive-wrapper scalar schema). */
export function resolveFieldExampleHint(f: SchemaField, schemas: Schema[]): string {
  if (f.example !== undefined && f.example !== '') return String(f.example);
  if (f.kind === 'ref') {
    const refSchema = schemas.find((s) => s.name === f.ref);
    if (refSchema?.scalarPrimitiveKey) {
      const p = findPrimitive(refSchema.scalarPrimitiveKey);
      if (p && p.example !== undefined) return typeof p.example === 'object' ? JSON.stringify(p.example) : String(p.example);
    }
  }
  if (f.kind === 'primitive') {
    const p = findPrimitive(f.primitiveKey);
    if (p && p.example !== undefined) return typeof p.example === 'object' ? JSON.stringify(p.example) : String(p.example);
  }
  return '';
}
