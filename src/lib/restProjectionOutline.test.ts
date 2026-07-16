import { describe, expect, it } from 'vitest';
import { buildOpenApiDocument, documentToJson, documentToYaml, type BuildExportDocumentParams } from './openapiExport';
import { buildRestProjectionOutline, uniqueInOrder, type OutlineNode } from './restProjectionOutline';
import type { Endpoint, Schema } from '../types/spec';
import type { RestProjectionFormat } from '../types/ui';

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

function baseSchema(overrides: Partial<Schema> = {}): Schema {
  return { id: 'sch_1', name: 'Widget', fields: [], contentTypes: ['application/json'], ...overrides };
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
      license: { name: '', url: '' },
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

function find(nodes: OutlineNode[], ...keys: string[]): OutlineNode {
  let current: OutlineNode | undefined;
  let pool = nodes;
  for (const key of keys) {
    current = pool.find((n) => n.key === key || n.label === key);
    if (!current) throw new Error(`outline node not found: ${keys.join(' > ')}`);
    pool = current.children ?? [];
  }
  return current!;
}

function lineText(text: string, line: number | null): string {
  if (line == null) throw new Error('expected a resolved line, got null');
  return text.split('\n')[line - 1];
}

describe('uniqueInOrder', () => {
  it('dedupes, drops falsy entries, and keeps first-seen order', () => {
    expect(uniqueInOrder(['users', 'admin', 'users', '', 'admin', 'billing'])).toEqual(['users', 'admin', 'billing']);
  });
});

describe('buildRestProjectionOutline', () => {
  const endpoints: Endpoint[] = [
    baseEndpoint({ id: 'ep_1', path: '/users', method: 'GET', operationId: 'listUsers', tags: ['users', 'admin'] }),
    baseEndpoint({ id: 'ep_2', path: '/users', method: 'POST', operationId: 'createUser', tags: ['users'] }),
    baseEndpoint({ id: 'ep_3', path: '/users/{id}', method: 'GET', operationId: '', tags: ['users'] }),
  ];
  const schemas: Schema[] = [baseSchema({ id: 's1', name: 'User' }), baseSchema({ id: 's2', name: 'Address' })];

  const doc = buildOpenApiDocument(
    baseParams({
      info: {
        title: 'Test API',
        version: '1.0.0',
        openapiVersion: '3.1.0',
        description: '',
        termsOfService: '',
        contact: { name: '', email: '', url: '' },
        license: { name: '', url: '' },
        servers: ['https://api.example.com', 'https://staging.example.com'],
        externalDocs: { description: '', url: '' },
      },
      endpoints,
      schemas,
      enabledSecuritySchemes: ['bearerAuth'],
    }),
  );

  const params = {
    tags: ['users', 'admin'],
    paths: ['/users', '/users/{id}'],
    operationIds: ['listUsers', 'createUser'],
    servers: ['https://api.example.com', 'https://staging.example.com'],
    schemaNames: ['User', 'Address'],
    securitySchemeNames: ['bearerAuth'],
  };

  for (const format of ['yaml', 'json'] as RestProjectionFormat[]) {
    describe(format, () => {
      const text = format === 'yaml' ? documentToYaml(doc) : documentToJson(doc);
      const outline = buildRestProjectionOutline({ text, format, ...params });

      it('resolves General > info and openapi to their root lines', () => {
        const info = find(outline, 'general', 'general-info');
        const openapi = find(outline, 'general', 'general-openapi');
        expect(lineText(text, info.line)).toMatch(/info/);
        expect(lineText(text, openapi.line)).toMatch(/openapi/);
      });

      it('resolves each tag to a real occurrence of that tag', () => {
        const usersTag = find(outline, 'tags', 'tag-0-users');
        const adminTag = find(outline, 'tags', 'tag-1-admin');
        expect(lineText(text, usersTag.line)).toContain('users');
        expect(lineText(text, adminTag.line)).toContain('admin');
      });

      it('dedupes paths (two endpoints sharing /users produce one Paths entry) and resolves both path lines', () => {
        expect(find(outline, 'paths').children).toHaveLength(2);
        expect(lineText(text, find(outline, 'paths', 'path-0').line)).toContain('/users');
        expect(lineText(text, find(outline, 'paths', 'path-1').line)).toContain('/users/{id}');
      });

      it('lists only endpoints with a non-empty operationId', () => {
        expect(find(outline, 'operationId').children).toHaveLength(2);
        expect(lineText(text, find(outline, 'operationId', 'opid-0-listUsers').line)).toContain('listUsers');
        expect(lineText(text, find(outline, 'operationId', 'opid-1-createUser').line)).toContain('createUser');
      });

      it('resolves each server URL to its own line, in order', () => {
        const s0 = find(outline, 'servers', 'server-0');
        const s1 = find(outline, 'servers', 'server-1');
        expect(lineText(text, s0.line)).toContain('api.example.com');
        expect(lineText(text, s1.line)).toContain('staging.example.com');
      });

      it('resolves Components > Schemas and Security Schemes to their nested entries', () => {
        expect(lineText(text, find(outline, 'components', 'schemas', 'schema-0').line)).toContain('User');
        expect(lineText(text, find(outline, 'components', 'schemas', 'schema-1').line)).toContain('Address');
        expect(lineText(text, find(outline, 'components', 'securitySchemes', 'securityScheme-0').line)).toContain(
          'bearerAuth',
        );
      });

      it('points the standalone Security leaf at the security schemes block', () => {
        const security = find(outline, 'security');
        expect(lineText(text, security.line)).toContain('securitySchemes');
      });
    });
  }

  it('degrades gracefully (all lines null, no throw) when the text does not match the expected document shape', () => {
    const outline = buildRestProjectionOutline({
      text: 'this is not a valid openapi document at all',
      format: 'yaml',
      ...params,
    });
    expect(find(outline, 'general', 'general-info').line).toBeNull();
    expect(find(outline, 'paths', 'path-0').line).toBeNull();
    expect(find(outline, 'components', 'schemas', 'schema-0').line).toBeNull();
    expect(find(outline, 'security').line).toBeNull();
  });

  it('returns an empty children array for sections with no real data', () => {
    const outline = buildRestProjectionOutline({
      text: documentToYaml(buildOpenApiDocument(baseParams())),
      format: 'yaml',
      tags: [],
      paths: [],
      operationIds: [],
      servers: [],
      schemaNames: [],
      securitySchemeNames: [],
    });
    expect(find(outline, 'tags').children).toEqual([]);
    expect(find(outline, 'servers').children).toEqual([]);
  });
});
