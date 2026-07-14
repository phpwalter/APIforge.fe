import { describe, expect, it } from 'vitest';
import { fieldSiblingBounds, fieldSubtreeEnd, fieldsToTree } from './schemaTree';
import type { SchemaFieldCustom } from '../types/spec';

function f(id: string, name: string, depth: number, extra: Partial<SchemaFieldCustom> = {}): SchemaFieldCustom {
  return { id, name, kind: 'custom', type: 'string', required: false, nullable: false, depth, example: '', ...extra };
}

describe('fieldsToTree', () => {
  it('nests deeper rows under the nearest shallower preceding row', () => {
    const fields = [
      f('1', 'address', 0, { type: 'object' }),
      f('2', 'street', 1),
      f('3', 'city', 1),
      f('4', 'tags', 0, { type: 'array' }),
    ];
    const tree = fieldsToTree(fields);
    expect(tree).toHaveLength(2);
    expect(tree[0].name).toBe('address');
    expect(tree[0].children.map((c) => c.name)).toEqual(['street', 'city']);
    expect(tree[1].name).toBe('tags');
    expect(tree[1].children).toEqual([]);
  });

  it('nests multiple levels deep', () => {
    const fields = [
      f('1', 'a', 0, { type: 'object' }),
      f('2', 'b', 1, { type: 'object' }),
      f('3', 'c', 2),
    ];
    const tree = fieldsToTree(fields);
    expect(tree[0].children[0].name).toBe('b');
    expect(tree[0].children[0].children[0].name).toBe('c');
  });
});

describe('fieldSubtreeEnd', () => {
  it('returns the index itself when the field has no children', () => {
    const fields = [f('1', 'a', 0), f('2', 'b', 0)];
    expect(fieldSubtreeEnd(fields, 0)).toBe(0);
  });

  it('returns the last index of the contiguous deeper block', () => {
    const fields = [f('1', 'a', 0), f('2', 'b', 1), f('3', 'c', 2), f('4', 'd', 1), f('5', 'e', 0)];
    expect(fieldSubtreeEnd(fields, 0)).toBe(3);
  });
});

describe('fieldSiblingBounds', () => {
  it('bounds a top-level field to the full contiguous top-level run', () => {
    const fields = [f('1', 'a', 0), f('2', 'b', 1), f('3', 'c', 0), f('4', 'd', 0)];
    expect(fieldSiblingBounds(fields, 0)).toEqual([0, 3]);
  });

  it('bounds a nested field to its sibling children only', () => {
    const fields = [f('1', 'parent', 0), f('2', 'child1', 1), f('3', 'child2', 1), f('4', 'after', 0)];
    expect(fieldSiblingBounds(fields, 1)).toEqual([1, 2]);
    expect(fieldSiblingBounds(fields, 2)).toEqual([1, 2]);
  });
});
