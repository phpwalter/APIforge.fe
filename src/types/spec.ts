export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE';

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

/**
 * A reusable object schema. `fieldCount` stands in for the real fields
 * array until the schema field editor (ref/primitive/custom kinds) is
 * built — see the TypeScript Conversion Notes in the handoff README.
 */
export interface Schema {
  id: string;
  name: string;
  fieldCount: number;
  scalar?: boolean;
}

/** A path's position in the endpoints-panel tree (parent/child by path prefix). */
export interface PathTreeNode {
  path: string;
  depth: number;
  parent: string | null;
}
