import type { PathTreeNode } from '../types/spec';

/**
 * Builds a parent/child tree over a flat list of paths: a path's parent is
 * the *longest* other path that is a strict "/"-prefix of it (e.g. the
 * parent of `/users/{id}/posts` is `/users/{id}`, not `/users`).
 *
 * `order` (optional) lets a manually-dragged sibling order override the
 * default alphabetical/insertion order — pass the current path order array
 * when you have one; omit it to just use insertion order.
 */
export function buildPathTree(paths: string[], order: string[] = []): PathTreeNode[] {
  const uniquePaths = [...new Set(paths)];

  const parentOf: Record<string, string | null> = {};
  uniquePaths.forEach((p) => {
    const ancestors = uniquePaths.filter((q) => q !== p && p.startsWith(q + '/'));
    parentOf[p] = ancestors.length ? ancestors.sort((a, b) => b.length - a.length)[0] : null;
  });

  const childrenOf: Record<string, string[]> = {};
  uniquePaths.forEach((p) => {
    const parent = parentOf[p];
    const key = parent === null ? '__root__' : parent;
    (childrenOf[key] ??= []).push(p);
  });

  const orderIndex: Record<string, number> = {};
  order.forEach((p, i) => {
    orderIndex[p] = i;
  });

  Object.keys(childrenOf).forEach((key) => {
    childrenOf[key].sort((a, b) => {
      const ia = a in orderIndex ? orderIndex[a] : Infinity;
      const ib = b in orderIndex ? orderIndex[b] : Infinity;
      if (ia !== ib) return ia - ib;
      return uniquePaths.indexOf(a) - uniquePaths.indexOf(b);
    });
  });

  const flat: PathTreeNode[] = [];
  const walk = (path: string, depth: number) => {
    flat.push({ path, depth, parent: parentOf[path] });
    (childrenOf[path] || []).forEach((c) => walk(c, depth + 1));
  };
  (childrenOf['__root__'] || []).forEach((r) => walk(r, 0));

  return flat;
}
