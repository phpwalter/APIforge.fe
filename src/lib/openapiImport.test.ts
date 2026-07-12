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
