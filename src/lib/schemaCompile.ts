import type { Schema } from '../types/spec';
import { scalarSchemaExample } from './schemaExample';
import { fieldsToTree, type SchemaFieldTreeNode } from './schemaTree';

export type SchemaCompileFormat = 'json' | 'yaml' | 'xml';

type JsonSchemaObj = Record<string, unknown>;

function compileFieldNode(node: SchemaFieldTreeNode): JsonSchemaObj {
  if (node.children.length) {
    const props: Record<string, JsonSchemaObj> = {};
    const required: string[] = [];
    node.children.forEach((c) => {
      if (c.name) props[c.name] = compileFieldNode(c);
      if (c.required === true) required.push(c.name);
    });
    const objSchema: JsonSchemaObj = { type: 'object', properties: props };
    if (required.length) objSchema.required = required;
    if (node.type === 'array') return { type: 'array', items: objSchema };
    return objSchema;
  }
  if (node.kind === 'ref' && node.type !== 'array') {
    return { $ref: `#/components/schemas/${node.ref}` };
  }
  if (node.type === 'array') {
    const itemsRef = node.kind === 'custom' ? node.itemsRef : undefined;
    const itemsType = node.kind === 'custom' ? node.itemsType : undefined;
    return itemsRef
      ? { type: 'array', items: { $ref: `#/components/schemas/${itemsRef}` } }
      : { type: 'array', items: { type: itemsType || 'string' } };
  }
  const p: JsonSchemaObj = { type: node.type || 'string' };
  if (node.kind === 'custom') {
    if (node.format) p.format = node.format;
    if (node.pattern) p.pattern = node.pattern;
    if (node.minLength !== undefined && node.minLength !== '') p.minLength = Number(node.minLength);
    if (node.maxLength !== undefined && node.maxLength !== '') p.maxLength = Number(node.maxLength);
    if (node.min !== undefined && node.min !== '') p.minimum = Number(node.min);
    if (node.max !== undefined && node.max !== '') p.maximum = Number(node.max);
    if (node.enumValues) {
      const vals = node.enumValues
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      if (vals.length) p.enum = vals;
    }
  }
  if (node.example !== undefined && node.example !== '') p.example = node.example;
  if (node.nullable) p.nullable = true;
  return p;
}

/** Compiles a schema block into a plain JSON-Schema-shaped object (mirrors the mockup's _compileSchemaObj). */
export function compileSchemaObj(schema: Schema): JsonSchemaObj {
  if (schema.scalar) {
    const o: JsonSchemaObj = { type: schema.scalarType || 'string' };
    if (schema.scalarFormat) o.format = schema.scalarFormat;
    if (schema.scalarDescription?.trim()) o.description = schema.scalarDescription;
    const ex = scalarSchemaExample(schema);
    if (ex !== undefined) o.example = ex;
    return o;
  }
  const tree = fieldsToTree(schema.fields);
  const props: Record<string, JsonSchemaObj> = {};
  const required: string[] = [];
  tree.forEach((node) => {
    if (node.name) props[node.name] = compileFieldNode(node);
    if (node.required === true) required.push(node.name);
  });
  const out: JsonSchemaObj = { type: 'object', properties: props };
  if (required.length) out.required = required;
  return out;
}

function yamlScalar(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  const s = String(v);
  return /[:#[\]{}",\n-]/.test(s) || s === '' || s !== s.trim() ? `'${s.replace(/'/g, "''")}'` : s;
}

/** Recursively renders a plain value tree as YAML lines (mirrors the mockup's _toYamlLines). */
export function toYamlLines(val: unknown, indent: number): string {
  const pad = '  '.repeat(indent);
  if (Array.isArray(val)) {
    if (!val.length) return `${pad}[]\n`;
    return val
      .map((v) => {
        if (v && typeof v === 'object' && Object.keys(v).length) {
          const lines = toYamlLines(v, indent + 1)
            .split('\n')
            .filter(Boolean);
          return `${pad}- ${lines[0].trim()}\n${lines
            .slice(1)
            .map((l) => `  ${l}`)
            .join('\n')}${lines.length > 1 ? '\n' : ''}`;
        }
        return `${pad}- ${yamlScalar(v)}\n`;
      })
      .join('');
  }
  if (val && typeof val === 'object') {
    const keys = Object.keys(val);
    if (!keys.length) return `${pad}{}\n`;
    return keys
      .map((k) => {
        const v = (val as Record<string, unknown>)[k];
        if (v && typeof v === 'object' && Object.keys(v).length) return `${pad}${k}:\n${toYamlLines(v, indent + 1)}`;
        if (Array.isArray(v) && v.length) return `${pad}${k}:\n${toYamlLines(v, indent + 1)}`;
        return `${pad}${k}: ${yamlScalar(v)}\n`;
      })
      .join('');
  }
  return `${pad}${yamlScalar(val)}\n`;
}

const TYPE_TO_XSD: Record<string, string> = {
  string: 'xs:string',
  integer: 'xs:integer',
  number: 'xs:decimal',
  boolean: 'xs:boolean',
};

function typeToXsd(t: string | undefined): string {
  return (t && TYPE_TO_XSD[t]) || 'xs:string';
}

function xmlEscapeXsd(s: unknown): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Compiles a schema block into a minimal XSD document (mirrors the mockup's _compileSchemaXsd). */
export function compileSchemaXsd(schema: Schema): string {
  let s = '<?xml version="1.0" encoding="UTF-8"?>\n<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">\n';
  if (schema.scalar) {
    s += `  <xs:element name="${xmlEscapeXsd(schema.name)}" type="${typeToXsd(schema.scalarType)}"/>\n`;
  } else {
    s += `  <xs:element name="${xmlEscapeXsd(schema.name)}">\n    <xs:complexType>\n      <xs:sequence>\n`;
    schema.fields.forEach((f) => {
      const minOccurs = f.required === true ? '1' : '0';
      if (f.kind === 'ref' && f.type !== 'array') {
        s += `        <xs:element name="${xmlEscapeXsd(f.name)}" type="${xmlEscapeXsd(f.ref)}Type" minOccurs="${minOccurs}"/>\n`;
      } else if (f.type === 'array') {
        const itemsRef = f.kind === 'custom' ? f.itemsRef : undefined;
        const itemsType = f.kind === 'custom' ? f.itemsType : undefined;
        const itemType = itemsRef ? `${xmlEscapeXsd(itemsRef)}Type` : typeToXsd(itemsType || 'string');
        s += `        <xs:element name="${xmlEscapeXsd(f.name)}" type="${itemType}" minOccurs="0" maxOccurs="unbounded"/>\n`;
      } else {
        s += `        <xs:element name="${xmlEscapeXsd(f.name)}" type="${typeToXsd(f.type)}" minOccurs="${minOccurs}"/>\n`;
      }
    });
    s += '      </xs:sequence>\n    </xs:complexType>\n  </xs:element>\n';
  }
  s += '</xs:schema>';
  return s;
}

/** Compiles a schema block to source code text in the given format (mirrors the mockup's compileSchemaCode). */
export function compileSchemaCode(schema: Schema | undefined, format: SchemaCompileFormat): string {
  if (!schema) return '';
  if (format === 'json') return JSON.stringify(compileSchemaObj(schema), null, 2);
  if (format === 'xml') return compileSchemaXsd(schema);
  return toYamlLines(compileSchemaObj(schema), 0);
}
