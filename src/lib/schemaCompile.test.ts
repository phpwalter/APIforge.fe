import { describe, expect, it } from 'vitest';
import { compileSchemaCode, compileSchemaObj } from './schemaCompile';
import type { Schema, SchemaFieldCustom, SchemaFieldRef } from '../types/spec';

function customField(id: string, name: string, extra: Partial<SchemaFieldCustom> = {}): SchemaFieldCustom {
  return { id, name, kind: 'custom', type: 'string', required: false, nullable: false, depth: 0, example: '', ...extra };
}

function refField(id: string, name: string, ref: string, extra: Partial<SchemaFieldRef> = {}): SchemaFieldRef {
  return { id, name, kind: 'ref', ref, type: 'object', required: false, nullable: false, depth: 0, example: '', ...extra };
}

describe('compileSchemaObj', () => {
  it('compiles an object schema with required properties and validation keywords', () => {
    const schema: Schema = {
      id: 'sc_1',
      name: 'User',
      fields: [
        customField('f1', 'id', { required: true, format: 'uuid' }),
        customField('f2', 'age', { type: 'integer', min: '0', max: '120' }),
      ],
      contentTypes: ['application/json'],
    };
    expect(compileSchemaObj(schema)).toEqual({
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        age: { type: 'integer', minimum: 0, maximum: 120 },
      },
      required: ['id'],
    });
  });

  it('compiles a $ref field to a $ref pointer rather than inlining it', () => {
    const schema: Schema = {
      id: 'sc_1',
      name: 'User',
      fields: [refField('f1', 'address', 'Address')],
      contentTypes: ['application/json'],
    };
    expect(compileSchemaObj(schema)).toEqual({
      type: 'object',
      properties: { address: { $ref: '#/components/schemas/Address' } },
    });
  });

  it('compiles a scalar schema to a type/format/example object', () => {
    const schema: Schema = {
      id: 'sc_1',
      name: 'Slug',
      scalar: true,
      scalarType: 'string',
      scalarFormat: 'slug',
      scalarPrimitiveKey: 'slug',
      fields: [],
      contentTypes: [],
    };
    const compiled = compileSchemaObj(schema) as Record<string, unknown>;
    expect(compiled.type).toBe('string');
    expect(compiled.format).toBe('slug');
    expect(compiled.example).toBe('my-awesome-product');
  });
});

describe('compileSchemaCode', () => {
  const schema: Schema = {
    id: 'sc_1',
    name: 'Error',
    fields: [customField('f1', 'code', { type: 'integer', required: true }), customField('f2', 'message')],
    contentTypes: ['application/json'],
  };

  it('returns an empty string for an undefined schema', () => {
    expect(compileSchemaCode(undefined, 'json')).toBe('');
  });

  it('renders pretty JSON', () => {
    const code = compileSchemaCode(schema, 'json');
    expect(JSON.parse(code)).toEqual({
      type: 'object',
      properties: { code: { type: 'integer' }, message: { type: 'string' } },
      required: ['code'],
    });
  });

  it('renders YAML lines', () => {
    const code = compileSchemaCode(schema, 'yaml');
    expect(code).toContain('type: object\n');
    expect(code).toContain('properties:\n');
    expect(code).toContain('code:\n');
    expect(code).toContain('required:\n');
  });

  it('renders a minimal XSD document', () => {
    const code = compileSchemaCode(schema, 'xml');
    expect(code).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(code).toContain('<xs:element name="Error">');
    expect(code).toContain('<xs:element name="code" type="xs:integer" minOccurs="1"/>');
    expect(code).toContain('<xs:element name="message" type="xs:string" minOccurs="0"/>');
  });
});
