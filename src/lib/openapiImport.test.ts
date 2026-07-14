import { describe, expect, it } from 'vitest';
import { parseOpenApiDocument } from './openapiImport';

describe('parseOpenApiDocument — XML', () => {
  it('parses an XML document using APIforge\'s object<->XML key-attribute scheme', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<openapi>
  <openapi>3.1.0</openapi>
  <info>
    <title>Test API</title>
    <version>1.0.0</version>
  </info>
  <paths>
    <_users__id_ key="/users/{id}">
      <get>
        <summary>Get a user</summary>
        <tags>admin</tags>
        <tags>users</tags>
        <responses>
          <_200 key="200">
            <description>OK</description>
          </_200>
        </responses>
      </get>
    </_users__id_>
  </paths>
</openapi>`;

    const result = parseOpenApiDocument(xml, 'spec.xml');

    expect(result.title).toBe('Test API');
    expect(result.version).toBe('1.0.0');
    expect(result.openapiVersion).toBe('3.1.0');
    expect(result.endpoints).toHaveLength(1);
    expect(result.endpoints[0]).toMatchObject({
      path: '/users/{id}',
      method: 'GET',
      summary: 'Get a user',
      tags: ['admin', 'users'],
    });
    expect(result.endpoints[0].responses[0]).toMatchObject({ code: '200', description: 'OK' });
  });

  it('detects XML by content even without a .xml filename', () => {
    const xml = `<openapi>
  <openapi>3.0.0</openapi>
  <info><title>Untitled</title></info>
  <paths>
    <_users key="/users">
      <get><summary>List</summary></get>
    </_users>
  </paths>
</openapi>`;

    const result = parseOpenApiDocument(xml, 'upload');
    expect(result.endpoints).toHaveLength(1);
    expect(result.endpoints[0].path).toBe('/users');
  });

  it('throws a friendly OpenApiImportError for invalid XML', () => {
    expect(() => parseOpenApiDocument('<openapi><unclosed></openapi>', 'spec.xml')).toThrow(/as XML/);
  });
});

describe('parseOpenApiDocument — schema properties', () => {
  const doc = `
openapi: 3.1.0
info:
  title: Test API
  version: 1.0.0
paths:
  /things:
    get:
      summary: List things
      responses:
        '200':
          description: OK
components:
  schemas:
    Uuid:
      type: string
      format: uuid
      x-apiforge-primitive: uuid
    Address:
      type: object
      properties:
        city:
          type: string
    Thing:
      type: object
      required:
        - id
      properties:
        id:
          $ref: '#/components/schemas/Uuid'
        address:
          $ref: '#/components/schemas/Address'
        tagIds:
          type: array
          items:
            $ref: '#/components/schemas/Uuid'
        tagNames:
          type: array
          items:
            type: string
        name:
          type: string
          format: slug
          example: cookie-auth
`;

  it('restores the x-apiforge-primitive extension as scalarPrimitiveKey on a scalar schema', () => {
    const result = parseOpenApiDocument(doc, 'spec.yaml');
    const uuid = result.schemas.find((s) => s.name === 'Uuid');
    expect(uuid).toMatchObject({ scalar: true, scalarType: 'string', scalarFormat: 'uuid', scalarPrimitiveKey: 'uuid' });
  });

  it('maps a $ref property pointing at a scalar schema to a ref-kind field carrying that scalar\'s type', () => {
    const result = parseOpenApiDocument(doc, 'spec.yaml');
    const thing = result.schemas.find((s) => s.name === 'Thing')!;
    const idField = thing.fields.find((f) => f.name === 'id')!;
    expect(idField).toMatchObject({ kind: 'ref', ref: 'Uuid', type: 'string', required: true });
  });

  it('maps a $ref property pointing at an object schema to a ref-kind field typed object', () => {
    const result = parseOpenApiDocument(doc, 'spec.yaml');
    const thing = result.schemas.find((s) => s.name === 'Thing')!;
    const addressField = thing.fields.find((f) => f.name === 'address')!;
    expect(addressField).toMatchObject({ kind: 'ref', ref: 'Address', type: 'object' });
  });

  it('maps an array of $ref items to a custom field with itemsRef', () => {
    const result = parseOpenApiDocument(doc, 'spec.yaml');
    const thing = result.schemas.find((s) => s.name === 'Thing')!;
    const tagIds = thing.fields.find((f) => f.name === 'tagIds')!;
    expect(tagIds).toMatchObject({ kind: 'custom', type: 'array', itemsRef: 'Uuid', itemsType: 'object' });
  });

  it('maps an array of primitive items to a custom field with itemsType', () => {
    const result = parseOpenApiDocument(doc, 'spec.yaml');
    const thing = result.schemas.find((s) => s.name === 'Thing')!;
    const tagNames = thing.fields.find((f) => f.name === 'tagNames')!;
    expect(tagNames).toMatchObject({ kind: 'custom', type: 'array', itemsType: 'string' });
  });

  it('still maps a plain typed property to a custom field with its format', () => {
    const result = parseOpenApiDocument(doc, 'spec.yaml');
    const thing = result.schemas.find((s) => s.name === 'Thing')!;
    const name = thing.fields.find((f) => f.name === 'name')!;
    expect(name).toMatchObject({ kind: 'custom', type: 'string', format: 'slug' });
  });

  it('carries a property\'s example value through to the field', () => {
    const result = parseOpenApiDocument(doc, 'spec.yaml');
    const thing = result.schemas.find((s) => s.name === 'Thing')!;
    const name = thing.fields.find((f) => f.name === 'name')!;
    expect(name.example).toBe('cookie-auth');
  });

  it('defaults example to an empty string when the property has none', () => {
    const result = parseOpenApiDocument(doc, 'spec.yaml');
    const thing = result.schemas.find((s) => s.name === 'Thing')!;
    const address = thing.fields.find((f) => f.name === 'address')!;
    expect(address.example).toBe('');
  });
});
