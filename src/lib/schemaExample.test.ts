import { describe, expect, it } from 'vitest';
import { fieldsToExampleValue, formatExampleForContentType, resolveFieldExampleHint, scalarSchemaExample } from './schemaExample';
import type { Schema, SchemaFieldCustom, SchemaFieldRef } from '../types/spec';

function customField(id: string, name: string, extra: Partial<SchemaFieldCustom> = {}): SchemaFieldCustom {
  return { id, name, kind: 'custom', type: 'string', required: false, nullable: false, depth: 0, example: '', ...extra };
}

function refField(id: string, name: string, ref: string, extra: Partial<SchemaFieldRef> = {}): SchemaFieldRef {
  return { id, name, kind: 'ref', ref, type: 'object', required: false, nullable: false, depth: 0, example: '', ...extra };
}

describe('fieldsToExampleValue', () => {
  it('builds a plain object from custom fields, using explicit examples first', () => {
    const schema: Schema = {
      id: 'sc_1',
      name: 'User',
      fields: [
        customField('f1', 'id', { example: 'abc-123' }),
        customField('f2', 'age', { type: 'integer' }),
        customField('f3', 'active', { type: 'boolean' }),
      ],
      contentTypes: ['application/json'],
    };
    expect(fieldsToExampleValue(schema, [schema])).toEqual({ id: 'abc-123', age: 0, active: true });
  });

  it('inlines a $ref field by recursing into the referenced schema', () => {
    const address: Schema = {
      id: 'sc_addr',
      name: 'Address',
      fields: [customField('a1', 'city', { example: 'Seattle' })],
      contentTypes: ['application/json'],
    };
    const user: Schema = {
      id: 'sc_user',
      name: 'User',
      fields: [refField('f1', 'address', 'Address')],
      contentTypes: ['application/json'],
    };
    expect(fieldsToExampleValue(user, [user, address])).toEqual({ address: { city: 'Seattle' } });
  });

  it('uses a wrapped primitive scalar schema example for a scalar $ref field', () => {
    const wrapper: Schema = {
      id: 'sc_slug',
      name: 'Slug',
      scalar: true,
      scalarType: 'string',
      scalarPrimitiveKey: 'slug',
      fields: [],
      contentTypes: ['application/json'],
    };
    const product: Schema = {
      id: 'sc_product',
      name: 'Product',
      fields: [refField('f1', 'slug', 'Slug')],
      contentTypes: ['application/json'],
    };
    const value = fieldsToExampleValue(product, [product, wrapper]) as { slug: unknown };
    expect(value.slug).toBe('my-awesome-product');
  });

  it('produces a nested object example for an inline object (container) field', () => {
    const schema: Schema = {
      id: 'sc_1',
      name: 'Order',
      fields: [
        customField('f1', 'meta', { type: 'object', depth: 0 }),
        customField('f2', 'page', { type: 'integer', depth: 1 }),
      ],
      contentTypes: ['application/json'],
    };
    expect(fieldsToExampleValue(schema, [schema])).toEqual({ meta: { page: 0 } });
  });

  it('returns the scalar placeholder/example for a scalar schema', () => {
    const scalar: Schema = { id: 'sc_1', name: 'Slug', scalar: true, scalarType: 'string', fields: [], contentTypes: [] };
    expect(scalarSchemaExample(scalar)).toBe('string');
  });
});

describe('formatExampleForContentType', () => {
  it('pretty-prints JSON for a json content type', () => {
    expect(formatExampleForContentType({ a: 1 }, 'application/json', 'Thing')).toBe('{\n  "a": 1\n}');
  });

  it('passes strings through unchanged', () => {
    expect(formatExampleForContentType('hello', 'text/plain', 'Thing')).toBe('hello');
  });

  it('renders a simple XML document from an object value', () => {
    const xml = formatExampleForContentType({ id: '1', name: 'Bob' }, 'application/xml', 'User');
    expect(xml).toBe('<User>\n  <id>1</id>\n  <name>Bob</name>\n</User>');
  });
});

describe('resolveFieldExampleHint', () => {
  it("prefers the field's own example", () => {
    const f = customField('f1', 'name', { example: 'Ada' });
    expect(resolveFieldExampleHint(f, [])).toBe('Ada');
  });

  it('falls back to the example of the primitive backing a $ref field', () => {
    const wrapper: Schema = {
      id: 'sc_slug',
      name: 'Slug',
      scalar: true,
      scalarPrimitiveKey: 'slug',
      fields: [],
      contentTypes: [],
    };
    const f = refField('f1', 'slug', 'Slug');
    expect(resolveFieldExampleHint(f, [wrapper])).toBe('my-awesome-product');
  });

  it('returns an empty string when there is no example to resolve', () => {
    const f = customField('f1', 'name');
    expect(resolveFieldExampleHint(f, [])).toBe('');
  });
});
