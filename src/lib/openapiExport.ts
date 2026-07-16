import { dump as dumpYaml } from 'js-yaml';
import { compileSchemaObj } from './schemaCompile';
import type { SecurityTypeDto } from './api/securityTypes';
import type { ApiContact, ApiExternalDocs, ApiLicense, Endpoint, HeaderParam, Param, Schema } from '../types/spec';

export type ExportVariant = 'full' | 'clean';
export type ExportFormat = 'yaml' | 'json';

const HTTP_STATUS_TEXT: Record<string, string> = {
  '200': 'OK',
  '201': 'Created',
  '202': 'Accepted',
  '204': 'No Content',
  '400': 'Bad Request',
  '401': 'Unauthorized',
  '403': 'Forbidden',
  '404': 'Not Found',
  '409': 'Conflict',
  '422': 'Unprocessable Entity',
  '429': 'Too Many Requests',
  '500': 'Internal Server Error',
  '502': 'Bad Gateway',
  '503': 'Service Unavailable',
};

function parseScopeNames(scopes: string | undefined): string[] {
  return (scopes ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function schemaObjWithVariant(schema: Schema, variant: ExportVariant): Record<string, unknown> {
  const obj = compileSchemaObj(schema);
  if (variant === 'full' && schema.scalar && schema.scalarPrimitiveKey) {
    return { ...obj, 'x-apiforge-primitive': schema.scalarPrimitiveKey };
  }
  return obj;
}

/** Maps a fetched security-type catalog row to its OpenAPI `type` discriminant. */
function securitySchemeKind(dto: SecurityTypeDto): 'apiKey' | 'http' | 'oauth2' | 'openIdConnect' | 'mutualTLS' {
  if (dto.flows) return 'oauth2';
  if (dto.openid_connect_url) return 'openIdConnect';
  if (dto.scheme) return 'http';
  if (dto.location && dto.parameter_name) return 'apiKey';
  return 'mutualTLS';
}

function securitySchemeObject(dto: SecurityTypeDto, scopesOverride: string | undefined): Record<string, unknown> {
  const kind = securitySchemeKind(dto);
  if (kind === 'apiKey') return { type: 'apiKey', in: dto.location, name: dto.parameter_name };
  if (kind === 'http') return { type: 'http', scheme: dto.scheme, ...(dto.bearer_format ? { bearerFormat: dto.bearer_format } : {}) };
  if (kind === 'openIdConnect') return { type: 'openIdConnect', openIdConnectUrl: dto.openid_connect_url };
  if (kind === 'oauth2') {
    let flows: Record<string, { scopes?: Record<string, string> } & Record<string, unknown>> = {};
    try {
      flows = dto.flows ? JSON.parse(dto.flows) : {};
    } catch {
      flows = {};
    }
    const scopeNames = parseScopeNames(scopesOverride);
    if (scopeNames.length) {
      const scopes = Object.fromEntries(scopeNames.map((name) => [name, name]));
      flows = Object.fromEntries(Object.entries(flows).map(([flowKey, flow]) => [flowKey, { ...flow, scopes }]));
    }
    return { type: 'oauth2', flows };
  }
  return { type: 'mutualTLS' };
}

/** Best-effort placeholder for a scheme name in use but not present in the fetched catalog. */
function legacySecuritySchemeObject(): Record<string, unknown> {
  return { type: 'apiKey', in: 'header', name: 'Authorization' };
}

function paramSchema(nullable: boolean, example: string): Record<string, unknown> {
  return {
    type: 'string',
    ...(nullable ? { nullable: true } : {}),
    ...(example ? { example } : {}),
  };
}

function buildParameters(params: Param[], headers: HeaderParam[]): Record<string, unknown>[] {
  return [
    ...params.map((p) => ({
      name: p.name,
      in: p.in,
      required: p.in === 'path' ? true : p.required,
      schema: paramSchema(p.nullable, p.example),
    })),
    ...headers.map((h) => ({
      name: h.name,
      in: 'header',
      required: h.required,
      schema: paramSchema(h.nullable, h.example),
    })),
  ];
}

function buildResponses(endpoint: Endpoint, schemaNames: Set<string>): Record<string, unknown> {
  const responses: Record<string, unknown> = {};
  endpoint.responses.forEach((r) => {
    const response: Record<string, unknown> = {
      description: r.description || HTTP_STATUS_TEXT[r.code] || 'Response',
    };
    if (r.headers.length) {
      response.headers = Object.fromEntries(
        r.headers.map((h) => [h.name, { required: h.required, schema: paramSchema(h.nullable, h.example) }]),
      );
    }
    if (r.schema && schemaNames.has(r.schema)) {
      const ref = { $ref: `#/components/schemas/${r.schema}` };
      const bodySchema = r.schemaIsArray ? { type: 'array', items: ref } : ref;
      response.content = Object.fromEntries(r.contentTypes.map((ct) => [ct, { schema: bodySchema }]));
    }
    responses[r.code] = response;
  });
  if (Object.keys(responses).length === 0) responses.default = { description: 'Response' };
  return responses;
}

function buildOperation(endpoint: Endpoint, schemaNames: Set<string>): Record<string, unknown> {
  const op: Record<string, unknown> = {
    responses: buildResponses(endpoint, schemaNames),
  };
  if (endpoint.summary) op.summary = endpoint.summary;
  if (endpoint.operationId) op.operationId = endpoint.operationId;
  if (endpoint.tags.length) op.tags = endpoint.tags;
  if (endpoint.security.length) {
    op.security = endpoint.security.map((name) => ({ [name]: [] as string[] }));
  }
  const parameters = buildParameters(endpoint.params, endpoint.headers);
  if (parameters.length) op.parameters = parameters;
  if (endpoint.requestBodyEnabled) {
    op.requestBody = {
      ...(endpoint.requestBodyDescription ? { description: endpoint.requestBodyDescription } : {}),
      required: true,
      content: { 'application/json': {} },
    };
  }
  return op;
}

export interface ProjectInfoForExport {
  title: string;
  version: string;
  openapiVersion: string;
  description: string;
  termsOfService: string;
  contact: ApiContact;
  license: ApiLicense;
  servers: string[];
  externalDocs: ApiExternalDocs;
}

export interface BuildExportDocumentParams {
  info: ProjectInfoForExport;
  endpoints: Endpoint[];
  schemas: Schema[];
  enabledSecuritySchemes: string[];
  securityScopes: Record<string, string>;
  securityTypes: SecurityTypeDto[];
  variant: ExportVariant;
}

/** Builds a plain OpenAPI 3.x document object from the current project state. */
export function buildOpenApiDocument(params: BuildExportDocumentParams): Record<string, unknown> {
  const { info, endpoints, schemas, enabledSecuritySchemes, securityScopes, securityTypes, variant } = params;

  const infoObj: Record<string, unknown> = { title: info.title || 'Untitled API', version: info.version || '1.0.0' };
  if (info.description) infoObj.description = info.description;
  if (info.termsOfService) infoObj.termsOfService = info.termsOfService;
  const contact = Object.fromEntries(Object.entries(info.contact).filter(([, v]) => v));
  if (Object.keys(contact).length) infoObj.contact = contact;
  const license = Object.fromEntries(Object.entries(info.license).filter(([, v]) => v));
  if (Object.keys(license).length) infoObj.license = license;

  const doc: Record<string, unknown> = {
    openapi: info.openapiVersion || '3.1.0',
    info: infoObj,
  };

  const servers = info.servers.filter(Boolean);
  if (servers.length) doc.servers = servers.map((url) => ({ url }));

  if (info.externalDocs.url) doc.externalDocs = Object.fromEntries(Object.entries(info.externalDocs).filter(([, v]) => v));

  const paths: Record<string, Record<string, unknown>> = {};
  const schemaNames = new Set(schemas.map((s) => s.name));
  endpoints.forEach((e) => {
    paths[e.path] = paths[e.path] || {};
    paths[e.path][e.method.toLowerCase()] = buildOperation(e, schemaNames);
  });
  doc.paths = paths;

  const components: Record<string, unknown> = {};
  if (schemas.length) {
    components.schemas = Object.fromEntries(schemas.map((s) => [s.name, schemaObjWithVariant(s, variant)]));
  }

  const usedSchemeNames = new Set([...enabledSecuritySchemes, ...endpoints.flatMap((e) => e.security)]);
  if (usedSchemeNames.size) {
    const dtoByName = new Map(securityTypes.map((t) => [t.openapi_name, t]));
    components.securitySchemes = Object.fromEntries(
      [...usedSchemeNames].map((name) => {
        const dto = dtoByName.get(name);
        return [name, dto ? securitySchemeObject(dto, securityScopes[name]) : legacySecuritySchemeObject()];
      }),
    );
  }
  if (Object.keys(components).length) doc.components = components;

  return doc;
}

export function documentToJson(doc: unknown): string {
  return JSON.stringify(doc, null, 2);
}

export function documentToYaml(doc: unknown): string {
  return dumpYaml(doc, { noRefs: true, lineWidth: -1 });
}

/** Slugifies a project title into a safe filename stem (e.g. "My API!" -> "my-api"). */
export function slugifyFilename(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'openapi';
}

/** Triggers a browser download of text content as a file. */
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
