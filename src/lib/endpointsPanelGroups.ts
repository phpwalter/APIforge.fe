import type { Endpoint, EndpointPathDraft } from '../types/spec';
import { buildPathTree } from './pathTree';
import { METHOD_PRIORITY } from './methodStyle';

export interface EndpointsPanelMethodChip {
  id: string;
  method: Endpoint['method'];
}

export interface EndpointsPanelRow {
  id: string;
  path: string;
  depth: number;
  methods: EndpointsPanelMethodChip[];
  draftId?: string;
}

export interface EndpointsPanelGroup {
  key: string;
  label: string;
  count: number;
  rows: EndpointsPanelRow[];
}

const DEFAULT_GROUP_KEY = '__default__';

function rowsForGroup(
  endpoints: Endpoint[],
  searchQuery: string,
  matcher: (e: Endpoint) => boolean,
): EndpointsPanelRow[] {
  const eligible = endpoints.filter((e) => e.method !== 'HEAD');
  const tree = buildPathTree(eligible.map((e) => e.path)).slice().sort((a, b) => a.path.localeCompare(b.path));

  const q = searchQuery.trim().toLowerCase();

  return tree
    .map((node): EndpointsPanelRow | null => {
      const methodsForPath = eligible
        .filter((e) => e.path === node.path && matcher(e))
        .slice()
        .sort((a, b) => METHOD_PRIORITY.indexOf(a.method) - METHOD_PRIORITY.indexOf(b.method));
      if (!methodsForPath.length) return null;
      return {
        id: methodsForPath[0].id,
        path: node.path,
        depth: node.depth,
        methods: methodsForPath.map((m) => ({ id: m.id, method: m.method })),
      };
    })
    .filter((row): row is EndpointsPanelRow => row !== null)
    .filter((row) => !q || row.path.toLowerCase().includes(q));
}

/**
 * Builds the endpoints panel's group list: an untagged "DEFAULT" group
 * first, then one group per tag (alphabetical), each filtered to rows
 * that actually have matching endpoints and dropped entirely if empty.
 */
export function buildEndpointsPanelGroups(
  endpoints: Endpoint[],
  searchQuery: string,
  drafts: EndpointPathDraft[] = [],
): EndpointsPanelGroup[] {
  const allTags = [...new Set(endpoints.flatMap((e) => e.tags))].sort((a, b) => a.localeCompare(b));

  const groups: EndpointsPanelGroup[] = [
    { key: DEFAULT_GROUP_KEY, label: 'DEFAULT', matcher: (e: Endpoint) => e.tags.length === 0 },
    ...allTags.map((tag) => ({ key: tag, label: tag, matcher: (e: Endpoint) => e.tags.includes(tag) })),
  ].map(({ key, label, matcher }) => {
    const rows = rowsForGroup(endpoints, searchQuery, matcher);
    if (key === DEFAULT_GROUP_KEY) {
      const q = searchQuery.trim().toLowerCase();
      const draftRows = drafts
        .filter((draft) => !q || draft.path.toLowerCase().includes(q))
        .map((draft) => ({ id: draft.id, draftId: draft.id, path: draft.path, depth: 0, methods: [] }));
      rows.push(...draftRows);
      rows.sort((a, b) => a.path.localeCompare(b.path));
    }
    return { key, label, count: rows.length, rows };
  });

  return groups.filter((g) => g.rows.length > 0);
}


export { DEFAULT_GROUP_KEY };
