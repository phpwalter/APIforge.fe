import type { SchemaField } from '../types/spec';

export type SchemaFieldTreeNode = SchemaField & { children: SchemaFieldTreeNode[] };

/** Converts a flat depth-annotated field list into a nested tree (mirrors the mockup's _fieldsToTree). */
export function fieldsToTree(fields: SchemaField[]): SchemaFieldTreeNode[] {
  const root: SchemaFieldTreeNode[] = [];
  const stack: { node: SchemaFieldTreeNode; depth: number }[] = [];
  for (const f of fields) {
    const depth = f.depth || 0;
    const node: SchemaFieldTreeNode = { ...f, children: [] };
    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
    if (stack.length === 0) root.push(node);
    else stack[stack.length - 1].node.children.push(node);
    stack.push({ node, depth });
  }
  return root;
}

/** Inclusive index of the last row in the contiguous descendant block starting at idx. */
export function fieldSubtreeEnd(fields: SchemaField[], idx: number): number {
  const d = fields[idx]?.depth || 0;
  let j = idx + 1;
  while (j < fields.length && (fields[j].depth || 0) > d) j++;
  return j - 1;
}

/** [start, end] inclusive bounds of the contiguous same-depth sibling block that idx belongs to. */
export function fieldSiblingBounds(fields: SchemaField[], idx: number): [number, number] {
  const d = fields[idx]?.depth || 0;
  let start = idx;
  while (start > 0 && (fields[start - 1]?.depth || 0) >= d) start--;
  let end = idx;
  while (end < fields.length - 1 && (fields[end + 1]?.depth || 0) >= d) end++;
  return [start, end];
}
