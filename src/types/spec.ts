export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE';

/** OpenAPI `info.contact` object. */
export interface ApiContact {
  name: string;
  email: string;
  url: string;
}

/** OpenAPI `info.license` object. */
export interface ApiLicense {
  name: string;
  url: string;
}

/** OpenAPI root-level `externalDocs` object. */
export interface ApiExternalDocs {
  description: string;
  url: string;
}

export type ParamLocation = 'query' | 'path' | 'header' | 'cookie';

export interface Param {
  id: string;
  name: string;
  in: ParamLocation;
  required: boolean;
}

/** Headers are always string-typed — no type picker, per the handoff README. */
export interface HeaderParam {
  id: string;
  name: string;
  required: boolean;
  /** True for policy-mandated headers (e.g. 401/403 on secured endpoints) — locked, can't be removed. */
  mandated?: boolean;
}

export interface ResponseEntry {
  id: string;
  code: string;
  description: string;
  headers: HeaderParam[];
  /** MIME types this response can be returned as. Never empty — falls back to application/json. */
  contentTypes: string[];
  /** Name of the referenced Schema, or '' for none. */
  schema: string;
  /** Whether the body is an array of `schema` rather than a single instance. */
  schemaIsArray: boolean;
}

export interface Endpoint {
  id: string;
  path: string;
  method: HttpMethod;
  summary: string;
  operationId: string;
  tags: string[];
  security: string[];
  params: Param[];
  headers: HeaderParam[];
  requestBodyEnabled: boolean;
  requestBodyDescription: string;
  responses: ResponseEntry[];
}

export type SchemaFieldKind = 'ref' | 'primitive' | 'custom';

/** JSON Schema type for a custom-kind field (or the effective type of a ref/primitive field). */
export type SchemaFieldType = 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object';

interface SchemaFieldBase {
  id: string;
  name: string;
  required: boolean;
  nullable: boolean;
  /** Nesting depth in the flat field list — 0 is top-level. Sibling order/nesting come from list position + depth. */
  depth: number;
  /** Free-text example shown per field (not used when type is 'array' or the field has nested children). */
  example: string;
}

/** Points to another Schema by name — shown as a purple "→ Name" pill, opens the type picker to change. */
export interface SchemaFieldRef extends SchemaFieldBase {
  kind: 'ref';
  ref: string;
  type: SchemaFieldType;
}

/** Backed by a primitives.ts catalog entry — locked; delete and re-add to change. */
export interface SchemaFieldPrimitive extends SchemaFieldBase {
  kind: 'primitive';
  primitiveKey: string;
  type: SchemaFieldType;
}

/** Freely typed — the only kind with an editable type select and validation constraints. */
export interface SchemaFieldCustom extends SchemaFieldBase {
  kind: 'custom';
  type: SchemaFieldType;
  format?: string;
  pattern?: string;
  minLength?: string;
  maxLength?: string;
  min?: string;
  max?: string;
  /** Comma-separated enum values, as typed (parsed only at compile/example time). */
  enumValues?: string;
  /** For type === 'array': a primitive item type, or 'object' when itemsRef is set. */
  itemsType?: SchemaFieldType;
  /** For type === 'array': name of the Schema the array's items reference. */
  itemsRef?: string;
}

export type SchemaField = SchemaFieldRef | SchemaFieldPrimitive | SchemaFieldCustom;

/**
 * A reusable schema — either an object schema (`fields`) or a scalar/primitive
 * schema (`scalar: true`, described by the scalar* fields instead).
 */
export interface Schema {
  id: string;
  name: string;
  scalar?: boolean;

  // Object schema (scalar falsy):
  fields: SchemaField[];
  /** MIME types this schema's auto-generated example is shown for. Never empty. */
  contentTypes: string[];

  // Scalar schema (scalar === true):
  scalarType?: SchemaFieldType;
  scalarFormat?: string;
  /** Set when this scalar schema wraps a primitives.ts catalog entry — locks type/format. */
  scalarPrimitiveKey?: string;
  scalarDescription?: string;
}

/** A path's position in the endpoints-panel tree (parent/child by path prefix). */
export interface PathTreeNode {
  path: string;
  depth: number;
  parent: string | null;
}
