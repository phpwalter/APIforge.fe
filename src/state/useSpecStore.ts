import { create } from 'zustand';
import type { Endpoint, HeaderParam, HttpMethod, Param, ResponseEntry, Schema } from '../types/spec';
import { METHOD_PRIORITY } from '../lib/methodStyle';

const EP_PANEL_MIN_WIDTH = 220;
const EP_PANEL_MAX_WIDTH = 480;
const EP_PANEL_DEFAULT_WIDTH = 292;

const SCHEMA_PANEL_MIN_WIDTH = 135;
const SCHEMA_PANEL_MAX_WIDTH = 420;
const SCHEMA_PANEL_DEFAULT_WIDTH = 175;

/** Fixed catalog for the security row's "Add auth" picker — stands in until the full Security Scheme manager modal is built. */
export const SECURITY_SCHEMES = ['bearerAuth', 'apiKeyAuth', 'oauth2'];

function uniquePath(existingPaths: string[], base: string): string {
  if (!existingPaths.includes(base)) return base;
  let i = 2;
  while (existingPaths.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function uniqueSchemaName(existingNames: string[], base: string): string {
  if (!existingNames.includes(base)) return base;
  let i = 2;
  while (existingNames.includes(`${base}${i}`)) i++;
  return `${base}${i}`;
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function defaultResponsesFor(method: HttpMethod): ResponseEntry[] {
  const ok: ResponseEntry = {
    id: makeId('res'),
    code: method === 'POST' ? '201' : '200',
    description: method === 'POST' ? 'Created' : 'OK',
  };
  return [ok];
}

function newEndpointDefaults(path: string, method: HttpMethod, summary = ''): Endpoint {
  return {
    id: makeId('ep'),
    path,
    method,
    summary,
    operationId: '',
    tags: [],
    security: [],
    params: [],
    headers: [],
    requestBodyEnabled: false,
    requestBodyDescription: '',
    responses: defaultResponsesFor(method),
  };
}

function slugify(path: string, method: HttpMethod): string {
  const parts = path
    .split('/')
    .filter(Boolean)
    .map((seg) => seg.replace(/[{}]/g, ''));
  const verb = method.toLowerCase();
  return verb + parts.map((p) => p[0].toUpperCase() + p.slice(1)).join('');
}

interface SpecState {
  hasDocument: boolean;
  importSpec: (parsed: { endpoints: Endpoint[]; schemas: Schema[] }) => void;
  loadSampleProject: () => void;

  importStatus: { type: 'success' | 'error'; message: string } | null;
  setImportStatus: (status: { type: 'success' | 'error'; message: string } | null) => void;

  endpoints: Endpoint[];
  selectedId: string | null;
  selectBlock: (id: string) => void;
  addEndpoint: () => void;
  toggleEndpointTag: (endpointId: string, tag: string) => void;

  // Method editor mutations
  pickMethod: (path: string, method: HttpMethod) => void;
  deleteMethod: (id: string) => void;
  setSummary: (id: string, summary: string) => void;
  setOperationId: (id: string, operationId: string) => void;
  generateOperationId: (id: string) => void;

  addParam: (id: string) => void;
  setParam: (id: string, paramId: string, patch: Partial<Param>) => void;
  removeParam: (id: string, paramId: string) => void;

  addHeader: (id: string) => void;
  setHeader: (id: string, headerId: string, patch: Partial<HeaderParam>) => void;
  removeHeader: (id: string, headerId: string) => void;

  toggleRequestBody: (id: string) => void;
  setRequestBodyDescription: (id: string, description: string) => void;

  addResponse: (id: string) => void;
  setResponse: (id: string, responseId: string, patch: Partial<ResponseEntry>) => void;
  removeResponse: (id: string, responseId: string) => void;

  addSecurity: (id: string, scheme: string) => void;
  removeSecurity: (id: string, scheme: string) => void;

  // Endpoints panel UI state
  panelSearch: string;
  setPanelSearch: (v: string) => void;
  expandedTags: Record<string, boolean>;
  toggleTagExpanded: (key: string) => void;
  expandAllTags: (keys: string[]) => void;
  collapseAllTags: (keys: string[]) => void;

  panelWidth: number;
  panelCollapsed: boolean;
  resizingPanel: boolean;
  setPanelWidth: (w: number) => void;
  toggleePanelCollapsed: () => void;
  setResizingPanel: (v: boolean) => void;

  draggingMethodId: string | null;
  dragOverTagKey: string | null;
  startDragMethod: (id: string) => void;
  endDragMethod: () => void;
  setDragOverTag: (key: string | null) => void;
  dropMethodOnTag: (tagKey: string) => void;

  // Schemas
  schemas: Schema[];
  addSchema: () => void;

  // Schema designer panel UI state
  schemaPanelSearch: string;
  setSchemaPanelSearch: (v: string) => void;
  schemaPanelWidth: number;
  schemaPanelCollapsed: boolean;
  resizingSchemaPanel: boolean;
  setSchemaPanelWidth: (w: number) => void;
  toggleSchemaPanelCollapsed: () => void;
  setResizingSchemaPanel: (v: boolean) => void;
}

const sampleEndpoints: Endpoint[] = [
  {
    ...newEndpointDefaults('/auth/session', 'GET', 'Get the current session'),
    id: 'ep_1',
    operationId: 'getSession',
    responses: [{ id: 'res_1a', code: '200', description: 'OK' }],
  },
  {
    ...newEndpointDefaults('/users', 'GET', 'List users'),
    id: 'ep_2',
    operationId: 'listUsers',
    tags: ['Users'],
    security: ['bearerAuth'],
    params: [{ id: 'pm_1', name: 'limit', in: 'query', required: false }],
    responses: [{ id: 'res_2a', code: '200', description: 'OK' }],
  },
  {
    ...newEndpointDefaults('/users', 'POST', 'Create a user'),
    id: 'ep_3',
    operationId: 'createUser',
    tags: ['Users'],
    security: ['bearerAuth'],
    requestBodyEnabled: true,
    requestBodyDescription: 'User to create',
    responses: [
      { id: 'res_3a', code: '201', description: 'Created' },
      { id: 'res_3b', code: '400', description: 'Bad Request' },
    ],
  },
  {
    ...newEndpointDefaults('/users/{id}', 'GET', 'Get a user by id'),
    id: 'ep_4',
    operationId: 'getUser',
    tags: ['Users'],
    security: ['bearerAuth'],
    params: [{ id: 'pm_2', name: 'id', in: 'path', required: true }],
    responses: [
      { id: 'res_4a', code: '200', description: 'OK' },
      { id: 'res_4b', code: '404', description: 'Not Found' },
    ],
  },
  {
    ...newEndpointDefaults('/users/{id}', 'PATCH', 'Update a user'),
    id: 'ep_5',
    operationId: 'updateUser',
    tags: ['Users'],
    security: ['bearerAuth'],
    params: [{ id: 'pm_3', name: 'id', in: 'path', required: true }],
    requestBodyEnabled: true,
    requestBodyDescription: 'Partial user fields to update',
    responses: [
      { id: 'res_5a', code: '200', description: 'OK' },
      { id: 'res_5b', code: '404', description: 'Not Found' },
    ],
  },
  {
    ...newEndpointDefaults('/users/{id}', 'DELETE', 'Delete a user'),
    id: 'ep_6',
    operationId: 'deleteUser',
    tags: ['Users'],
    security: ['bearerAuth'],
    params: [{ id: 'pm_4', name: 'id', in: 'path', required: true }],
    responses: [{ id: 'res_6a', code: '204', description: 'No Content' }],
  },
  {
    ...newEndpointDefaults('/users/{id}/posts', 'GET', "List a user's posts"),
    id: 'ep_7',
    operationId: 'listUserPosts',
    tags: ['Users', 'Posts'],
    security: ['bearerAuth'],
    params: [{ id: 'pm_5', name: 'id', in: 'path', required: true }],
    responses: [{ id: 'res_7a', code: '200', description: 'OK' }],
  },
  {
    ...newEndpointDefaults('/posts', 'GET', 'List posts'),
    id: 'ep_8',
    operationId: 'listPosts',
    tags: ['Posts'],
    responses: [{ id: 'res_8a', code: '200', description: 'OK' }],
  },
  {
    ...newEndpointDefaults('/posts', 'POST', 'Create a post'),
    id: 'ep_9',
    operationId: 'createPost',
    tags: ['Posts'],
    security: ['bearerAuth'],
    requestBodyEnabled: true,
    requestBodyDescription: 'Post to create',
    responses: [{ id: 'res_9a', code: '201', description: 'Created' }],
  },
  {
    ...newEndpointDefaults('/posts/{id}', 'GET', 'Get a post by id'),
    id: 'ep_10',
    operationId: 'getPost',
    tags: ['Posts'],
    params: [{ id: 'pm_6', name: 'id', in: 'path', required: true }],
    responses: [
      { id: 'res_10a', code: '200', description: 'OK' },
      { id: 'res_10b', code: '404', description: 'Not Found' },
    ],
  },
];

const sampleSchemas: Schema[] = [
  { id: 'sc_1', name: 'User', fieldCount: 5 },
  { id: 'sc_2', name: 'Post', fieldCount: 4 },
  { id: 'sc_3', name: 'Error', fieldCount: 2 },
  { id: 'sc_4', name: 'PaginationMeta', fieldCount: 3 },
];

export const useSpecStore = create<SpecState>((set, get) => ({
  hasDocument: false,
  importSpec: ({ endpoints, schemas }) =>
    set({
      endpoints,
      schemas,
      hasDocument: true,
      selectedId: endpoints[0]?.id ?? schemas[0]?.id ?? null,
      // Reset panel/editor UI state left over from any previous document.
      panelSearch: '',
      schemaPanelSearch: '',
      expandedTags: {},
    }),
  loadSampleProject: () =>
    set({
      endpoints: sampleEndpoints,
      schemas: sampleSchemas,
      hasDocument: true,
      selectedId: sampleEndpoints[0].id,
    }),

  importStatus: null,
  setImportStatus: (importStatus) => set({ importStatus }),

  endpoints: [],
  selectedId: null,
  selectBlock: (id) => set({ selectedId: id }),

  addEndpoint: () => {
    const { endpoints } = get();
    const path = uniquePath(
      endpoints.map((e) => e.path),
      '/new-endpoint',
    );
    const newEndpoint = newEndpointDefaults(path, 'GET');
    set({ endpoints: [...endpoints, newEndpoint], selectedId: newEndpoint.id });
  },

  toggleEndpointTag: (endpointId, tag) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === endpointId
          ? { ...e, tags: e.tags.includes(tag) ? e.tags.filter((t) => t !== tag) : [...e.tags, tag] }
          : e,
      ),
    })),

  pickMethod: (path, method) => {
    const { endpoints } = get();
    const existing = endpoints.find((e) => e.path === path && e.method === method);
    if (existing) {
      set({ selectedId: existing.id });
      return;
    }
    const newEndpoint = newEndpointDefaults(path, method);
    set({ endpoints: [...endpoints, newEndpoint], selectedId: newEndpoint.id });
  },

  deleteMethod: (id) =>
    set((s) => {
      const remaining = s.endpoints.filter((e) => e.id !== id);
      const wasSelected = s.selectedId === id;
      return {
        endpoints: remaining,
        selectedId: wasSelected ? (remaining[0]?.id ?? null) : s.selectedId,
      };
    }),

  setSummary: (id, summary) =>
    set((s) => ({ endpoints: s.endpoints.map((e) => (e.id === id ? { ...e, summary } : e)) })),
  setOperationId: (id, operationId) =>
    set((s) => ({ endpoints: s.endpoints.map((e) => (e.id === id ? { ...e, operationId } : e)) })),
  generateOperationId: (id) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) => (e.id === id ? { ...e, operationId: slugify(e.path, e.method) } : e)),
    })),

  addParam: (id) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id
          ? { ...e, params: [...e.params, { id: makeId('pm'), name: '', in: 'query', required: false }] }
          : e,
      ),
    })),
  setParam: (id, paramId, patch) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id ? { ...e, params: e.params.map((p) => (p.id === paramId ? { ...p, ...patch } : p)) } : e,
      ),
    })),
  removeParam: (id, paramId) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id ? { ...e, params: e.params.filter((p) => p.id !== paramId) } : e,
      ),
    })),

  addHeader: (id) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id ? { ...e, headers: [...e.headers, { id: makeId('hd'), name: '', required: false }] } : e,
      ),
    })),
  setHeader: (id, headerId, patch) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id
          ? { ...e, headers: e.headers.map((h) => (h.id === headerId ? { ...h, ...patch } : h)) }
          : e,
      ),
    })),
  removeHeader: (id, headerId) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id ? { ...e, headers: e.headers.filter((h) => h.id !== headerId) } : e,
      ),
    })),

  toggleRequestBody: (id) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id ? { ...e, requestBodyEnabled: !e.requestBodyEnabled } : e,
      ),
    })),
  setRequestBodyDescription: (id, requestBodyDescription) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) => (e.id === id ? { ...e, requestBodyDescription } : e)),
    })),

  addResponse: (id) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id
          ? { ...e, responses: [...e.responses, { id: makeId('res'), code: '200', description: '' }] }
          : e,
      ),
    })),
  setResponse: (id, responseId, patch) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id
          ? { ...e, responses: e.responses.map((r) => (r.id === responseId ? { ...r, ...patch } : r)) }
          : e,
      ),
    })),
  removeResponse: (id, responseId) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id ? { ...e, responses: e.responses.filter((r) => r.id !== responseId) } : e,
      ),
    })),

  addSecurity: (id, scheme) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id && !e.security.includes(scheme) ? { ...e, security: [...e.security, scheme] } : e,
      ),
    })),
  removeSecurity: (id, scheme) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id ? { ...e, security: e.security.filter((sc) => sc !== scheme) } : e,
      ),
    })),

  panelSearch: '',
  setPanelSearch: (v) => set({ panelSearch: v }),

  expandedTags: {},
  toggleTagExpanded: (key) =>
    set((s) => {
      const current = s.expandedTags[key] !== false;
      return { expandedTags: { ...s.expandedTags, [key]: !current } };
    }),
  expandAllTags: (keys) =>
    set((s) => {
      const next = { ...s.expandedTags };
      keys.forEach((k) => {
        next[k] = true;
      });
      return { expandedTags: next };
    }),
  collapseAllTags: (keys) =>
    set((s) => {
      const next = { ...s.expandedTags };
      keys.forEach((k) => {
        next[k] = false;
      });
      return { expandedTags: next };
    }),

  panelWidth: EP_PANEL_DEFAULT_WIDTH,
  panelCollapsed: false,
  resizingPanel: false,
  setPanelWidth: (w) => set({ panelWidth: Math.min(EP_PANEL_MAX_WIDTH, Math.max(EP_PANEL_MIN_WIDTH, w)) }),
  toggleePanelCollapsed: () => set((s) => ({ panelCollapsed: !s.panelCollapsed })),
  setResizingPanel: (v) => set({ resizingPanel: v }),

  draggingMethodId: null,
  dragOverTagKey: null,
  startDragMethod: (id) => set({ draggingMethodId: id }),
  endDragMethod: () => set({ draggingMethodId: null, dragOverTagKey: null }),
  setDragOverTag: (key) => set({ dragOverTagKey: key }),
  dropMethodOnTag: (tagKey) => {
    const { draggingMethodId, endpoints, toggleEndpointTag } = get();
    if (draggingMethodId && tagKey !== '__default__') {
      const ep = endpoints.find((e) => e.id === draggingMethodId);
      if (ep && !ep.tags.includes(tagKey)) toggleEndpointTag(ep.id, tagKey);
    }
    set({ draggingMethodId: null, dragOverTagKey: null });
  },

  schemas: [],
  addSchema: () => {
    const { schemas } = get();
    const name = uniqueSchemaName(
      schemas.map((s) => s.name),
      'NewSchema',
    );
    const newSchema: Schema = { id: makeId('sc'), name, fieldCount: 0 };
    set({ schemas: [...schemas, newSchema], selectedId: newSchema.id });
  },

  schemaPanelSearch: '',
  setSchemaPanelSearch: (v) => set({ schemaPanelSearch: v }),
  schemaPanelWidth: SCHEMA_PANEL_DEFAULT_WIDTH,
  schemaPanelCollapsed: false,
  resizingSchemaPanel: false,
  setSchemaPanelWidth: (w) =>
    set({ schemaPanelWidth: Math.min(SCHEMA_PANEL_MAX_WIDTH, Math.max(SCHEMA_PANEL_MIN_WIDTH, w)) }),
  toggleSchemaPanelCollapsed: () => set((s) => ({ schemaPanelCollapsed: !s.schemaPanelCollapsed })),
  setResizingSchemaPanel: (v) => set({ resizingSchemaPanel: v }),
}));

export function methodsForPath(endpoints: Endpoint[], path: string): HttpMethod[] {
  return endpoints
    .filter((e) => e.path === path)
    .map((e) => e.method)
    .sort((a, b) => METHOD_PRIORITY.indexOf(a) - METHOD_PRIORITY.indexOf(b));
}

export { EP_PANEL_MIN_WIDTH, EP_PANEL_MAX_WIDTH, SCHEMA_PANEL_MIN_WIDTH, SCHEMA_PANEL_MAX_WIDTH };
