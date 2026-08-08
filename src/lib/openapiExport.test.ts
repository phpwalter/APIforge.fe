import { describe, expect, it } from 'vitest';
import { load as loadYaml } from 'js-yaml';
import {
  buildOpenApiDocument,
  documentToJson,
  documentToYaml,
  slugifyFilename,
  type BuildExportDocumentParams,
} from './openapiExport';
import type { SecurityTypeDto } from './api/securityTypes';
import type { Endpoint, Schema, SchemaFieldCustom } from '../types/spec';

function customField(id: string, name: string, extra: Partial<SchemaFieldCustom> = {}): SchemaFieldCustom {
  return { id, name, kind: 'custom', type: 'string', required: false, nullable: false, depth: 0, example: '', ...extra };
}

function baseEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    id: 'ep_1',
    path: '/things',
    method: 'GET',
    summary: '',
    operationId: '',
    tags: [],
    security: [],
    params: [],
    headers: [],
    requestBodyEnabled: false,
    requestBodyDescription: '',
    responses: [],
    ...overrides,
  };
}

function baseParams(overrides: Partial<BuildExportDocumentParams> = {}): BuildExportDocumentParams {
  return {
    info: {
      title: 'Test API',
      version: '1.0.0',
      openapiVersion: '3.1.0',
      description: '',
      termsOfService: '',
      contact: { name: '', email: '', url: '' },
      license: { id: '', name: '', spdxId: '', url: '' },
      servers: [],
      externalDocs: { description: '', url: '' },
    },
    endpoints: [],
    schemas: [],
    enabledSecuritySchemes: [],
    securityScopes: {},
    securityTypes: [],
    variant: 'clean',
    ...overrides,
  };
}

describe('buildOpenApiDocument', () => {
  it('builds the info object and openapi version', () => {
    const doc = buildOpenApiDocument(baseParams()) as { openapi: string; info: Record<string, unknown> };
    expect(doc.openapi).toBe('3.1.0');
    expect(doc.info).toEqual({ title: 'Test API', version: '1.0.0' });
  });

  it('emits SPDX license.identifier for OpenAPI 3.2', () => {
    const doc = buildOpenApiDocument(
      baseParams({
        info: {
          ...baseParams().info,
          openapiVersion: '3.2.0',
          license: {
            id: 'mit-id',
            name: 'MIT License',
            spdxId: 'MIT',
            url: 'https://spdx.org/licenses/MIT.html',
          },
        },
      }),
    ) as { info: { license: Record<string, unknown> } };

    expect(doc.info.license).toEqual({ name: 'MIT License', identifier: 'MIT' });
  });

  it('uses license.url for OpenAPI 3.0', () => {
    const doc = buildOpenApiDocument(
      baseParams({
        info: {
          ...baseParams().info,
          openapiVersion: '3.0.3',
          license: {
            id: 'mit-id',
            name: 'MIT License',
            spdxId: 'MIT',
            url: 'https://spdx.org/licenses/MIT.html',
          },
        },
      }),
    ) as { info: { license: Record<string, unknown> } };

    expect(doc.info.license).toEqual({ name: 'MIT License', url: 'https://spdx.org/licenses/MIT.html' });
  });

  it('includes optional info fields only when present', () => {
    const doc = buildOpenApiDocument(
      baseParams({
        info: {
          title: 'Test API',
          version: '1.0.0',
          openapiVersion: '3.1.0',
          description: 'A test API',
          termsOfService: 'https://example.com/terms',
          contact: { name: 'Ada', email: '', url: '' },
          license: { id: '', name: '', spdxId: '', url: '' },
          servers: ['https://api.example.com', ''],
          externalDocs: { description: 'Docs', url: 'https://docs.example.com' },
        },
      }),
    ) as Record<string, unknown>;
    expect(doc.info).toEqual({
      title: 'Test API',
      version: '1.0.0',
      description: 'A test API',
      termsOfService: 'https://example.com/terms',
      contact: { name: 'Ada' },
    });
    expect(doc.servers).toEqual([{ url: 'https://api.example.com' }]);
    expect(doc.externalDocs).toEqual({ description: 'Docs', url: 'https://docs.example.com' });
  });

  it('maps an endpoint to a path/operation with parameters, headers, and responses', () => {
    const endpoint = baseEndpoint({
      path: '/users/{id}',
      method: 'GET',
      summary: 'Get a user',
      operationId: 'getUser',
      tags: ['Users'],
      params: [{ id: 'pm_1', name: 'id', in: 'path', required: false, nullable: false, example: '' }],
      headers: [{ id: 'hd_1', name: 'X-Trace-Id', required: false, nullable: false, example: '' }],
      responses: [{ id: 'res_1', code: '200', description: 'OK', headers: [], contentTypes: ['application/json'], schema: '', schemaIsArray: false }],
    });
    const doc = buildOpenApiDocument(baseParams({ endpoints: [endpoint] })) as {
      paths: Record<string, Record<string, Record<string, unknown>>>;
    };
    const op = doc.paths['/users/{id}'].get;
    expect(op.summary).toBe('Get a user');
    expect(op.operationId).toBe('getUser');
    expect(op.tags).toEqual(['Users']);
    expect(op.parameters).toEqual([
      { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      { name: 'X-Trace-Id', in: 'header', required: false, schema: { type: 'string' } },
    ]);
    expect(op.responses).toEqual({ '200': { description: 'OK' } });
  });

  it('defaults a response description from the status code when blank', () => {
    const endpoint = baseEndpoint({
      responses: [{ id: 'res_1', code: '404', description: '', headers: [], contentTypes: ['application/json'], schema: '', schemaIsArray: false }],
    });
    const doc = buildOpenApiDocument(baseParams({ endpoints: [endpoint] })) as {
      paths: Record<string, Record<string, Record<string, unknown>>>;
    };
    expect(doc.paths['/things'].get.responses).toEqual({ '404': { description: 'Not Found' } });
  });

  it('references a response schema by $ref, wrapping in an array when schemaIsArray', () => {
    const schema: Schema = { id: 'sc_1', name: 'User', fields: [customField('f1', 'id')], contentTypes: ['application/json'] };
    const endpoint = baseEndpoint({
      responses: [
        { id: 'res_1', code: '200', description: 'OK', headers: [], contentTypes: ['application/json'], schema: 'User', schemaIsArray: true },
      ],
    });
    const doc = buildOpenApiDocument(baseParams({ endpoints: [endpoint], schemas: [schema] })) as {
      paths: Record<string, Record<string, Record<string, unknown>>>;
    };
    const responses = doc.paths['/things'].get.responses as Record<string, { content: Record<string, unknown> }>;
    expect(responses['200'].content).toEqual({
      'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } },
    });
  });

  it('marks path parameters as required regardless of the stored flag', () => {
    const endpoint = baseEndpoint({ params: [{ id: 'pm_1', name: 'id', in: 'path', required: false, nullable: false, example: '' }] });
    const doc = buildOpenApiDocument(baseParams({ endpoints: [endpoint] })) as {
      paths: Record<string, Record<string, Record<string, unknown>>>;
    };
    const params = doc.paths['/things'].get.parameters as { required: boolean }[];
    expect(params[0].required).toBe(true);
  });

  it('emits nullable and example on a parameter and a header schema', () => {
    const endpoint = baseEndpoint({
      params: [{ id: 'pm_1', name: 'verbose', in: 'query', required: false, nullable: true, example: '' }],
      headers: [{ id: 'hd_1', name: 'X-Trace-Id', required: false, nullable: false, example: 'abc-123' }],
    });
    const doc = buildOpenApiDocument(baseParams({ endpoints: [endpoint] })) as {
      paths: Record<string, Record<string, Record<string, unknown>>>;
    };
    const params = doc.paths['/things'].get.parameters as { name: string; schema: Record<string, unknown> }[];
    expect(params.find((p) => p.name === 'verbose')?.schema).toEqual({ type: 'string', nullable: true });
    expect(params.find((p) => p.name === 'X-Trace-Id')?.schema).toEqual({ type: 'string', example: 'abc-123' });
  });

  it('emits nullable and example on a response header schema', () => {
    const endpoint = baseEndpoint({
      responses: [
        {
          id: 'res_1',
          code: '200',
          description: 'OK',
          headers: [{ id: 'hd_1', name: 'X-Rate-Limit', required: false, nullable: true, example: '100' }],
          contentTypes: ['application/json'],
          schema: '',
          schemaIsArray: false,
        },
      ],
    });
    const doc = buildOpenApiDocument(baseParams({ endpoints: [endpoint] })) as {
      paths: Record<string, Record<string, Record<string, unknown>>>;
    };
    const responses = doc.paths['/things'].get.responses as Record<string, { headers: Record<string, { schema: unknown }> }>;
    expect(responses['200'].headers['X-Rate-Limit'].schema).toEqual({ type: 'string', nullable: true, example: '100' });
  });

  it('includes a requestBody when enabled', () => {
    const endpoint = baseEndpoint({ requestBodyEnabled: true, requestBodyDescription: 'Thing to create' });
    const doc = buildOpenApiDocument(baseParams({ endpoints: [endpoint] })) as {
      paths: Record<string, Record<string, Record<string, unknown>>>;
    };
    expect(doc.paths['/things'].get.requestBody).toEqual({
      description: 'Thing to create',
      required: true,
      content: { 'application/json': {} },
    });
  });

  it('compiles component schemas via compileSchemaObj', () => {
    const schema: Schema = {
      id: 'sc_1',
      name: 'User',
      fields: [customField('f1', 'id', { required: true })],
      contentTypes: ['application/json'],
    };
    const doc = buildOpenApiDocument(baseParams({ schemas: [schema] })) as {
      components: { schemas: Record<string, unknown> };
    };
    expect(doc.components.schemas.User).toEqual({
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    });
  });

  it('adds an x-apiforge-primitive extension for scalar schemas only in the full variant', () => {
    const scalar: Schema = {
      id: 'sc_1',
      name: 'Slug',
      scalar: true,
      scalarType: 'string',
      scalarPrimitiveKey: 'slug',
      fields: [],
      contentTypes: [],
    };
    const clean = buildOpenApiDocument(baseParams({ schemas: [scalar], variant: 'clean' })) as {
      components: { schemas: Record<string, Record<string, unknown>> };
    };
    const full = buildOpenApiDocument(baseParams({ schemas: [scalar], variant: 'full' })) as {
      components: { schemas: Record<string, Record<string, unknown>> };
    };
    expect(clean.components.schemas.Slug['x-apiforge-primitive']).toBeUndefined();
    expect(full.components.schemas.Slug['x-apiforge-primitive']).toBe('slug');
  });

  it('builds an apiKey security scheme from the catalog and applies it to operations', () => {
    const dto: SecurityTypeDto = {
      id: '1',
      security_scheme_type_id: 't1',
      slug: 'api-key-auth',
      name: 'API Key Authentication',
      description: '',
      openapi_name: 'apiKeyAuth',
      format: null,
      example: null,
      scheme: null,
      bearer_format: null,
      location: 'header',
      parameter_name: 'X-API-Key',
      openid_connect_url: null,
      flows: null,
      is_active: true,
      metadata: '{}',
      created_at: '',
      updated_at: '',
      deleted_at: null,
    };
    const endpoint = baseEndpoint({ security: ['apiKeyAuth'] });
    const doc = buildOpenApiDocument(
      baseParams({ endpoints: [endpoint], enabledSecuritySchemes: ['apiKeyAuth'], securityTypes: [dto] }),
    ) as { components: { securitySchemes: Record<string, unknown> }; paths: Record<string, Record<string, Record<string, unknown>>> };
    expect(doc.components.securitySchemes.apiKeyAuth).toEqual({ type: 'apiKey', in: 'header', name: 'X-API-Key' });
    expect(doc.paths['/things'].get.security).toEqual([{ apiKeyAuth: [] }]);
  });

  it('builds an oauth2 security scheme and overrides scopes from the user-edited scopes string', () => {
    const dto: SecurityTypeDto = {
      id: '2',
      security_scheme_type_id: 't2',
      slug: 'oauth2-auth',
      name: 'OAuth 2.0',
      description: '',
      openapi_name: 'oauth2Auth',
      format: null,
      example: null,
      scheme: null,
      bearer_format: null,
      location: null,
      parameter_name: null,
      openid_connect_url: null,
      flows: JSON.stringify({ authorizationCode: { authorizationUrl: 'https://x/authorize', tokenUrl: 'https://x/token', scopes: {} } }),
      is_active: true,
      metadata: '{}',
      created_at: '',
      updated_at: '',
      deleted_at: null,
    };
    const doc = buildOpenApiDocument(
      baseParams({
        enabledSecuritySchemes: ['oauth2Auth'],
        securityTypes: [dto],
        securityScopes: { oauth2Auth: 'read:things, write:things' },
      }),
    ) as { components: { securitySchemes: Record<string, { flows: Record<string, { scopes: Record<string, string> }> }> } };
    expect(doc.components.securitySchemes.oauth2Auth.flows.authorizationCode.scopes).toEqual({
      'read:things': 'read:things',
      'write:things': 'write:things',
    });
  });

  it('falls back to a generic apiKey placeholder for a legacy scheme with no catalog entry', () => {
    const endpoint = baseEndpoint({ security: ['customLegacyAuth'] });
    const doc = buildOpenApiDocument(baseParams({ endpoints: [endpoint] })) as {
      components: { securitySchemes: Record<string, unknown> };
    };
    expect(doc.components.securitySchemes.customLegacyAuth).toEqual({ type: 'apiKey', in: 'header', name: 'Authorization' });
  });

  it('omits components.securitySchemes entirely when no scheme is enabled or used', () => {
    const doc = buildOpenApiDocument(baseParams()) as { components?: Record<string, unknown> };
    expect(doc.components).toBeUndefined();
  });
});

describe('serialization', () => {
  it('round-trips through YAML', () => {
    const doc = buildOpenApiDocument(baseParams({ info: { ...baseParams().info, description: 'Hi' } }));
    const yaml = documentToYaml(doc);
    expect(loadYaml(yaml)).toEqual(doc);
  });

  it('round-trips through JSON', () => {
    const doc = buildOpenApiDocument(baseParams());
    expect(JSON.parse(documentToJson(doc))).toEqual(doc);
  });
});

describe('slugifyFilename', () => {
  it('lowercases and hyphenates, stripping non-alphanumerics', () => {
    expect(slugifyFilename('My Cool API!')).toBe('my-cool-api');
  });

  it('falls back to "openapi" for an empty or fully-stripped title', () => {
    expect(slugifyFilename('   ')).toBe('openapi');
    expect(slugifyFilename('!!!')).toBe('openapi');
  });
});
