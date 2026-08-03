import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Endpoint,
  EndpointPathDraft,
  HeaderParam,
  HttpMethod,
  Param,
  ResponseEntry,
  ResponseHeaderPolicyOption,
  Schema,
  SchemaFieldCustom,
  SchemaFieldType,
} from '../types/spec';
import { METHOD_PRIORITY } from '../lib/methodStyle';
import { DEFAULT_CODE_FOR_CLASS, type ResponseClass } from '../lib/responseClass';
import { findPrimitive } from '../lib/primitives';
import { fieldSubtreeEnd, fieldSiblingBounds } from '../lib/schemaTree';
import type { SchemaCompileFormat } from '../lib/schemaCompile';
import { isOutlineGroupDefaultExpanded } from '../lib/restProjectionOutline';
import { fetchResponseHeaderPolicy, type ApiResponseHeaderPolicyItem } from '../lib/api/apiHeaders';
import { fetchResolvedMethodPolicy, type ResolvedMethodPolicyItem } from '../lib/api/methodPolicies';

const EP_PANEL_MIN_WIDTH = 220;
const EP_PANEL_MAX_WIDTH = 480;
const EP_PANEL_DEFAULT_WIDTH = 292;

const SCHEMA_PANEL_MIN_WIDTH = 135;
const SCHEMA_PANEL_MAX_WIDTH = 420;
const SCHEMA_PANEL_DEFAULT_WIDTH = 175;

const COMPILE_PANEL_MIN_WIDTH = 135;
const COMPILE_PANEL_MAX_WIDTH = 560;
const COMPILE_PANEL_DEFAULT_WIDTH = 175;

const OUTLINE_PANEL_MIN_WIDTH = 180;
const OUTLINE_PANEL_MAX_WIDTH = 420;
const OUTLINE_PANEL_DEFAULT_WIDTH = 220;

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

function uniqueFieldName(existingNames: string[], base: string): string {
  if (!existingNames.includes(base)) return base;
  let i = 2;
  while (existingNames.includes(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

function makeResponseEntry(id: string, code: string, description = ''): ResponseEntry {
  return { id, code, description, headers: [], contentTypes: ['application/json'], schema: '', schemaIsArray: false };
}

function makeParam(id: string, name: string, extra: Partial<Param> = {}): Param {
  return { id, name, in: 'query', required: false, nullable: false, example: '', ...extra };
}

function makeHeaderParam(id: string, name: string, extra: Partial<HeaderParam> = {}): HeaderParam {
  return { id, name, required: false, nullable: false, example: '', ...extra };
}

function normalizedHeaderName(name: string): string {
  return name.trim().toLowerCase();
}

function policyHeaderParam(policy: ApiResponseHeaderPolicyItem): HeaderParam {
  return makeHeaderParam(makeId('hd'), policy.header_name, {
    required: policy.policy_code === 'required',
    mandated: policy.policy_code === 'required',
    nullable: false,
    example: policy.default_value_template ?? policy.example_value ?? '',
    policyCode: policy.policy_code,
    policyConditionCode: policy.condition_code,
    policyRationale: policy.rationale,
    catalogCode: policy.header_code,
    policyAutoAdded: true,
  });
}

function shouldAutoAddPolicy(response: ResponseEntry, policy: ApiResponseHeaderPolicyItem): boolean {
  if (policy.policy_code === 'required') return true;
  if (policy.policy_code !== 'conditional') return false;
  if (policy.condition_code === 'when_representation_present') return Boolean(response.schema);
  return policy.default_enabled;
}

function mergeResponseHeaderPolicy(
  response: ResponseEntry,
  statusCode: number,
  policies: ApiResponseHeaderPolicyItem[],
): ResponseEntry {
  const byName = new Map(policies.map((policy) => [normalizedHeaderName(policy.header_name), policy]));
  const forbidden = new Set(
    policies.filter((policy) => policy.policy_code === 'forbidden').map((policy) => normalizedHeaderName(policy.header_name)),
  );

  const headers: HeaderParam[] = response.headers
    .filter((header) => !forbidden.has(normalizedHeaderName(header.name)))
    .filter((header) => {
      const policy = byName.get(normalizedHeaderName(header.name));
      return !(header.policyAutoAdded && policy && !shouldAutoAddPolicy(response, policy));
    })
    .map((header) => {
      const policy = byName.get(normalizedHeaderName(header.name));
      if (!policy) return { ...header, mandated: false, policyCode: undefined };
      return {
        ...header,
        required: policy.policy_code === 'required' ? true : header.required,
        mandated: policy.policy_code === 'required',
        policyCode: policy.policy_code,
        policyConditionCode: policy.condition_code,
        policyRationale: policy.rationale,
        catalogCode: policy.header_code,
        policyAutoAdded: header.policyAutoAdded,
      };
    });

  const present = new Set(headers.map((header) => normalizedHeaderName(header.name)));
  policies
    .filter(
      (policy) =>
        shouldAutoAddPolicy(response, policy),
    )
    .forEach((policy) => {
      const key = normalizedHeaderName(policy.header_name);
      if (!present.has(key)) {
        headers.push(policyHeaderParam(policy));
        present.add(key);
      }
    });

  const headerPolicies: ResponseHeaderPolicyOption[] = policies.map((policy) => ({
    headerCode: policy.header_code,
    headerName: policy.header_name,
    displayName: policy.display_name,
    description: policy.description,
    policyCode: policy.policy_code,
    conditionCode: policy.condition_code,
    conditionName: policy.condition_name,
    rationale: policy.rationale,
    defaultEnabled: policy.default_enabled,
    exampleValue: policy.example_value,
    defaultValueTemplate: policy.default_value_template,
    displayOrder: policy.display_order,
  }));

  return {
    ...response,
    headers,
    headerPolicyStatusCode: statusCode,
    headerPolicyError: null,
    headerPolicies,
  };
}

function makeCustomField(
  id: string,
  name: string,
  type: SchemaFieldType,
  extra: Partial<SchemaFieldCustom> = {},
): SchemaFieldCustom {
  return { id, name, kind: 'custom', type, required: false, nullable: false, depth: 0, example: '', ...extra };
}

/** Draft state for the Primitive Picker's "Custom" tab — mirrors the mockup's customDraft* fields. */
interface CustomFieldDraft {
  name: string;
  type: SchemaFieldType;
  format: string;
  pattern: string;
  minLength: string;
  maxLength: string;
  min: string;
  max: string;
  enumValues: string;
  example: string;
  /** 'prim:<type>' or 'ref:<SchemaName>' — the array item-type select's value. */
  itemsValue: string;
  required: boolean;
  nullable: boolean;
}

const DEFAULT_CUSTOM_FIELD_DRAFT: CustomFieldDraft = {
  name: '',
  type: 'string',
  format: '',
  pattern: '',
  minLength: '',
  maxLength: '',
  min: '',
  max: '',
  enumValues: '',
  example: '',
  itemsValue: 'prim:string',
  required: true,
  nullable: false,
};

const FALLBACK_METHOD_RESPONSES: Record<HttpMethod, Array<[string, string]>> = {
  GET: [['200', 'OK'], ['400', 'Bad Request'], ['404', 'Not Found'], ['500', 'Internal Server Error']],
  POST: [['201', 'Created'], ['400', 'Bad Request'], ['409', 'Conflict'], ['422', 'Unprocessable Content'], ['500', 'Internal Server Error']],
  PUT: [['200', 'OK'], ['400', 'Bad Request'], ['404', 'Not Found'], ['409', 'Conflict'], ['422', 'Unprocessable Content'], ['500', 'Internal Server Error']],
  PATCH: [['200', 'OK'], ['400', 'Bad Request'], ['404', 'Not Found'], ['409', 'Conflict'], ['422', 'Unprocessable Content'], ['500', 'Internal Server Error']],
  DELETE: [['204', 'No Content'], ['404', 'Not Found'], ['409', 'Conflict'], ['500', 'Internal Server Error']],
  HEAD: [['200', 'OK'], ['404', 'Not Found'], ['500', 'Internal Server Error']],
  OPTIONS: [['200', 'OK'], ['500', 'Internal Server Error']],
  TRACE: [['200', 'OK'], ['405', 'Method Not Allowed'], ['500', 'Internal Server Error']],
};

function defaultResponsesFor(method: HttpMethod): ResponseEntry[] {
  return FALLBACK_METHOD_RESPONSES[method].map(([code, title]) => makeResponseEntry(makeId('res'), code, title));
}

function responsesFromPolicy(method: HttpMethod, policy: ResolvedMethodPolicyItem[]): ResponseEntry[] {
  const enabled = policy.filter((item) => item.is_enabled).sort((a, b) => a.display_order - b.display_order);
  if (!enabled.length) return defaultResponsesFor(method);
  return enabled.map((item) => makeResponseEntry(makeId('res'), String(item.status_code), item.title));
}

function newEndpointDefaults(path: string, method: HttpMethod, summary = '', responses = defaultResponsesFor(method)): Endpoint {
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
    responses,
  };
}

function slugify(path: string, method: HttpMethod): string {
  const parts = path
    .split('/')
    .map((seg) => seg.replace(/[{}]/g, ''))
    .filter(Boolean);
  const verb = method.toLowerCase();
  return verb + parts.map((p) => p[0].toUpperCase() + p.slice(1)).join('');
}

export interface SpecState {
  hasDocument: boolean;
  importSpec: (parsed: { endpoints: Endpoint[]; schemas: Schema[] }) => void;
  loadSampleProject: () => void;
  /** Closes the current document back to the empty state (Topbar :: More actions :: Close Project). */
  closeDocument: () => void;

  importStatus: { type: 'success' | 'error'; message: string } | null;
  setImportStatus: (status: { type: 'success' | 'error'; message: string } | null) => void;

  endpoints: Endpoint[];
  endpointDrafts: EndpointPathDraft[];
  /** Design Canvas's last-selected endpoint — kept separate from selectedSchemaId so each tab remembers its own selection. */
  selectedEndpointId: string | null;
  selectedEndpointDraftId: string | null;
  selectEndpoint: (id: string) => void;
  selectEndpointDraft: (id: string) => void;
  addEndpoint: () => void;
  toggleEndpointTag: (endpointId: string, tag: string) => void;

  // Method editor mutations
  pickMethod: (path: string, method: HttpMethod, context?: { companyId?: string | null; projectId?: string | null; planCode?: string | null }) => Promise<void>;
  /** Renames a path across every method that shares it, plus any descendant path nested beneath it. */
  renamePath: (oldPath: string, newPath: string) => void;
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
  addResponseForClass: (id: string, cls: ResponseClass) => void;
  setResponse: (id: string, responseId: string, patch: Partial<ResponseEntry>) => void;
  setResponseCodeWithHeaderPolicy: (id: string, responseId: string, code: string) => Promise<void>;
  applyResponseHeaderPolicy: (id: string, responseId: string, statusCode: number) => Promise<void>;
  removeResponse: (id: string, responseId: string) => void;

  addResponseHeader: (id: string, responseId: string, headerName?: string) => void;
  setResponseHeader: (id: string, responseId: string, headerId: string, patch: Partial<HeaderParam>) => void;
  removeResponseHeader: (id: string, responseId: string, headerId: string) => void;
  toggleResponseContentType: (id: string, responseId: string, contentType: string) => void;

  // Which param/header row (by its own id, unique across params/headers/response-headers) has its
  // example-editing panel expanded — mirrors Schema Designer's expandedSchemaFieldKey.
  expandedParamKey: string | null;
  toggleParamExpanded: (id: string) => void;

  // Response subpanel UI state — the status-class pill selected per endpoint.
  responseActiveClass: Record<string, ResponseClass>;
  setResponseActiveClass: (endpointId: string, cls: ResponseClass) => void;

  addSecurity: (id: string, scheme: string) => void;
  removeSecurity: (id: string, scheme: string) => void;

  // Security schemes (Project Settings :: Security panel) — which catalog scheme names are
  // enabled project-wide, and their OAuth2/OIDC scopes. Drives the endpoint editor's "+ Add auth"
  // suggestions.
  enabledSecuritySchemes: string[];
  securityScopes: Record<string, string>;
  /** Project Settings :: Security's whole draft commits in one shot on OK/Apply (see
   * src/components/Project/projectSettingsDraft.ts) — nothing in that tab writes live until
   * this runs. Diffs the incoming enabled-list against the current one to find catalog schemes
   * just turned off, unions that with removedLegacySchemes, and strips every matching scheme
   * name from every endpoint's security[] in the same commit. */
  applySecurityDraft: (
    enabledSecuritySchemes: string[],
    securityScopes: Record<string, string>,
    removedLegacySchemes: string[],
  ) => void;

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
  /** Schema Designer's last-selected schema — kept separate from selectedEndpointId so each tab remembers its own selection. */
  selectedSchemaId: string | null;
  selectSchema: (id: string) => void;
  addSchema: () => void;
  /** Creates a uniquely-named schema without changing the current selection — for inline "create new" pickers. Returns the new schema's name. */
  addSchemaReturningName: () => string;
  setSchemaName: (schemaId: string, name: string) => void;
  deleteSchema: (schemaId: string) => void;
  setScalarDescription: (schemaId: string, description: string) => void;
  toggleSchemaContentType: (schemaId: string, contentType: string) => void;

  // Schema field CRUD/tree operations (all keyed by index within the schema's flat, depth-annotated field list)
  /** Appends a blank custom (string) field to the end of the schema's field list — no picker involved. */
  addBlankSchemaField: (schemaId: string) => void;
  setSchemaField: (schemaId: string, index: number, patch: Partial<SchemaFieldCustom>) => void;
  setSchemaFieldType: (schemaId: string, index: number, type: SchemaFieldType) => void;
  setSchemaFieldItems: (schemaId: string, index: number, value: string) => void;
  removeSchemaField: (schemaId: string, index: number) => void;
  toggleSchemaFieldRequired: (schemaId: string, index: number) => void;
  toggleSchemaFieldNullable: (schemaId: string, index: number) => void;
  indentSchemaField: (schemaId: string, index: number) => void;
  outdentSchemaField: (schemaId: string, index: number) => void;

  expandedSchemaFieldKey: string | null;
  toggleSchemaFieldExpanded: (schemaId: string, index: number) => void;

  // Schema field drag-to-reorder (same-depth siblings only)
  draggingSchemaFieldSchemaId: string | null;
  draggingSchemaFieldIndex: number | null;
  dragOverSchemaFieldIndex: number | null;
  startDragSchemaField: (schemaId: string, index: number) => void;
  setDragOverSchemaField: (schemaId: string, index: number) => void;
  clearDragOverSchemaField: () => void;
  dropSchemaField: (schemaId: string, toIndex: number) => void;
  endDragSchemaField: () => void;

  // Transient error/status toast for schema field operations (required-remove guard, invalid reorder, etc.)
  schemaToast: string | null;
  setSchemaToast: (message: string | null) => void;

  // Primitive Picker modal — inserts a field backed by a catalog primitive, a $ref to another schema, or a freely-typed custom field.
  fieldPickerOpen: boolean;
  fieldPickerSchemaId: string | null;
  /** Set when the picker was opened to *convert* an existing field's kind (via the type select's "Convert…" option), rather than to add a new one. */
  fieldPickerConvertIndex: number | null;
  fieldPickerMode: 'primitive' | 'schema' | 'custom';
  fieldPickerCategory: string;
  fieldPickerSearch: string;
  fieldPickerSelectedKey: string | null;
  openFieldPicker: (schemaId: string, convertIndex?: number | null) => void;
  closeFieldPicker: () => void;
  setFieldPickerMode: (mode: 'primitive' | 'schema' | 'custom') => void;
  setFieldPickerCategory: (cat: string) => void;
  setFieldPickerSearch: (v: string) => void;
  selectFieldPickerPrimitive: (pkey: string | null) => void;
  insertPrimitiveField: (pkey: string) => void;
  insertSchemaRefField: (schemaName: string) => void;

  customFieldDraft: CustomFieldDraft;
  setCustomFieldDraft: (patch: Partial<CustomFieldDraft>) => void;
  addCustomField: () => void;

  // Schema designer panel UI state
  schemaPanelSearch: string;
  setSchemaPanelSearch: (v: string) => void;
  schemaPanelWidth: number;
  schemaPanelCollapsed: boolean;
  resizingSchemaPanel: boolean;
  setSchemaPanelWidth: (w: number) => void;
  toggleSchemaPanelCollapsed: () => void;
  setResizingSchemaPanel: (v: boolean) => void;

  // Schema compile/preview side panel (right-anchored)
  schemaCompileFormat: SchemaCompileFormat;
  setSchemaCompileFormat: (format: SchemaCompileFormat) => void;
  compilePanelWidth: number;
  compilePanelCollapsed: boolean;
  resizingCompilePanel: boolean;
  setCompilePanelWidth: (w: number) => void;
  toggleCompilePanelCollapsed: () => void;
  setResizingCompilePanel: (v: boolean) => void;

  // REST Projection outline panel (left-anchored document nav tree)
  restProjectionOutlineExpanded: Record<string, boolean>;
  toggleRestProjectionOutlineExpanded: (key: string) => void;
  restProjectionOutlinePanelWidth: number;
  restProjectionOutlinePanelCollapsed: boolean;
  resizingRestProjectionOutlinePanel: boolean;
  setRestProjectionOutlinePanelWidth: (w: number) => void;
  toggleRestProjectionOutlinePanelCollapsed: () => void;
  setResizingRestProjectionOutlinePanel: (v: boolean) => void;
}

const sampleEndpoints: Endpoint[] = [
  {
    ...newEndpointDefaults('/auth/session', 'GET', 'Get the current session'),
    id: 'ep_1',
    operationId: 'getSession',
    responses: [makeResponseEntry('res_1a', '200', 'OK')],
  },
  {
    ...newEndpointDefaults('/users', 'GET', 'List users'),
    id: 'ep_2',
    operationId: 'listUsers',
    tags: ['Users'],
    security: ['bearerAuth'],
    params: [makeParam('pm_1', 'limit', { in: 'query', required: false })],
    responses: [makeResponseEntry('res_2a', '200', 'OK')],
  },
  {
    ...newEndpointDefaults('/users', 'POST', 'Create a user'),
    id: 'ep_3',
    operationId: 'createUser',
    tags: ['Users'],
    security: ['bearerAuth'],
    requestBodyEnabled: true,
    requestBodyDescription: 'User to create',
    responses: [makeResponseEntry('res_3a', '201', 'Created'), makeResponseEntry('res_3b', '400', 'Bad Request')],
  },
  {
    ...newEndpointDefaults('/users/{id}', 'GET', 'Get a user by id'),
    id: 'ep_4',
    operationId: 'getUser',
    tags: ['Users'],
    security: ['bearerAuth'],
    params: [makeParam('pm_2', 'id', { in: 'path', required: true })],
    responses: [makeResponseEntry('res_4a', '200', 'OK'), makeResponseEntry('res_4b', '404', 'Not Found')],
  },
  {
    ...newEndpointDefaults('/users/{id}', 'PATCH', 'Update a user'),
    id: 'ep_5',
    operationId: 'updateUser',
    tags: ['Users'],
    security: ['bearerAuth'],
    params: [makeParam('pm_3', 'id', { in: 'path', required: true })],
    requestBodyEnabled: true,
    requestBodyDescription: 'Partial user fields to update',
    responses: [makeResponseEntry('res_5a', '200', 'OK'), makeResponseEntry('res_5b', '404', 'Not Found')],
  },
  {
    ...newEndpointDefaults('/users/{id}', 'DELETE', 'Delete a user'),
    id: 'ep_6',
    operationId: 'deleteUser',
    tags: ['Users'],
    security: ['bearerAuth'],
    params: [makeParam('pm_4', 'id', { in: 'path', required: true })],
    responses: [makeResponseEntry('res_6a', '204', 'No Content')],
  },
  {
    ...newEndpointDefaults('/users/{id}/posts', 'GET', "List a user's posts"),
    id: 'ep_7',
    operationId: 'listUserPosts',
    tags: ['Users', 'Posts'],
    security: ['bearerAuth'],
    params: [makeParam('pm_5', 'id', { in: 'path', required: true })],
    responses: [makeResponseEntry('res_7a', '200', 'OK')],
  },
  {
    ...newEndpointDefaults('/posts', 'GET', 'List posts'),
    id: 'ep_8',
    operationId: 'listPosts',
    tags: ['Posts'],
    responses: [makeResponseEntry('res_8a', '200', 'OK')],
  },
  {
    ...newEndpointDefaults('/posts', 'POST', 'Create a post'),
    id: 'ep_9',
    operationId: 'createPost',
    tags: ['Posts'],
    security: ['bearerAuth'],
    requestBodyEnabled: true,
    requestBodyDescription: 'Post to create',
    responses: [makeResponseEntry('res_9a', '201', 'Created')],
  },
  {
    ...newEndpointDefaults('/posts/{id}', 'GET', 'Get a post by id'),
    id: 'ep_10',
    operationId: 'getPost',
    tags: ['Posts'],
    params: [makeParam('pm_6', 'id', { in: 'path', required: true })],
    responses: [makeResponseEntry('res_10a', '200', 'OK'), makeResponseEntry('res_10b', '404', 'Not Found')],
  },
];

const sampleSchemas: Schema[] = [
  {
    id: 'sc_1',
    name: 'User',
    contentTypes: ['application/json'],
    fields: [
      makeCustomField('sf_1a', 'id', 'string', { required: true, format: 'uuid' }),
      makeCustomField('sf_1b', 'name', 'string', { required: true }),
      makeCustomField('sf_1c', 'email', 'string', { required: true, format: 'email' }),
      makeCustomField('sf_1d', 'isActive', 'boolean'),
      makeCustomField('sf_1e', 'createdAt', 'string', { format: 'date-time' }),
    ],
  },
  {
    id: 'sc_2',
    name: 'Post',
    contentTypes: ['application/json'],
    fields: [
      makeCustomField('sf_2a', 'id', 'string', { required: true, format: 'uuid' }),
      makeCustomField('sf_2b', 'title', 'string', { required: true }),
      makeCustomField('sf_2c', 'body', 'string'),
      makeCustomField('sf_2d', 'authorId', 'string', { format: 'uuid' }),
    ],
  },
  {
    id: 'sc_3',
    name: 'Error',
    contentTypes: ['application/json'],
    fields: [
      makeCustomField('sf_3a', 'code', 'integer', { required: true }),
      makeCustomField('sf_3b', 'message', 'string', { required: true }),
    ],
  },
  {
    id: 'sc_4',
    name: 'PaginationMeta',
    contentTypes: ['application/json'],
    fields: [
      makeCustomField('sf_4a', 'page', 'integer', { required: true }),
      makeCustomField('sf_4b', 'pageSize', 'integer', { required: true }),
      makeCustomField('sf_4c', 'total', 'integer', { required: true }),
    ],
  },
];

export const useSpecStore = create<SpecState>()(
  subscribeWithSelector((set, get) => ({
  hasDocument: false,
  importSpec: ({ endpoints, schemas }) =>
    set({
      endpoints,
      endpointDrafts: [],
      schemas,
      hasDocument: true,
      selectedEndpointId: endpoints[0]?.id ?? null,
      selectedEndpointDraftId: null,
      selectedSchemaId: schemas[0]?.id ?? null,
      // Reset panel/editor UI state left over from any previous document.
      panelSearch: '',
      schemaPanelSearch: '',
      expandedTags: {},
      expandedParamKey: null,
      responseActiveClass: {},
      enabledSecuritySchemes: [],
      securityScopes: {},
    }),
  loadSampleProject: () =>
    set({
      endpoints: sampleEndpoints,
      endpointDrafts: [],
      schemas: sampleSchemas,
      hasDocument: true,
      selectedEndpointId: sampleEndpoints[0].id,
      selectedEndpointDraftId: null,
      selectedSchemaId: sampleSchemas[0]?.id ?? null,
      enabledSecuritySchemes: ['bearerAuth'],
    }),
  closeDocument: () =>
    set({
      endpoints: [],
      endpointDrafts: [],
      schemas: [],
      hasDocument: false,
      selectedEndpointId: null,
      selectedEndpointDraftId: null,
      selectedSchemaId: null,
      panelSearch: '',
      schemaPanelSearch: '',
      expandedTags: {},
      expandedParamKey: null,
      responseActiveClass: {},
      enabledSecuritySchemes: [],
      securityScopes: {},
    }),

  importStatus: null,
  setImportStatus: (importStatus) => set({ importStatus }),

  endpoints: [],
  endpointDrafts: [],
  selectedEndpointId: null,
  selectedEndpointDraftId: null,
  selectEndpoint: (id) => set({ selectedEndpointId: id, selectedEndpointDraftId: null }),
  selectEndpointDraft: (id) => set({ selectedEndpointId: null, selectedEndpointDraftId: id }),

  addEndpoint: () => {
    const { endpoints, endpointDrafts } = get();
    const path = uniquePath(
      [...endpoints.map((e) => e.path), ...endpointDrafts.map((draft) => draft.path)],
      '/new-endpoint',
    );
    const draft = { id: makeId('path'), path };
    set({ endpointDrafts: [...endpointDrafts, draft], selectedEndpointId: null, selectedEndpointDraftId: draft.id });
  },

  toggleEndpointTag: (endpointId, tag) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === endpointId
          ? { ...e, tags: e.tags.includes(tag) ? e.tags.filter((t) => t !== tag) : [...e.tags, tag] }
          : e,
      ),
    })),

  pickMethod: async (path, method, context = {}) => {
    const { endpoints, endpointDrafts } = get();
    const existing = endpoints.find((e) => e.path === path && e.method === method);
    if (existing) {
      set({ selectedEndpointId: existing.id, selectedEndpointDraftId: null });
      return;
    }

    let responses = defaultResponsesFor(method);
    let source: 'system' | 'company' | 'project' = 'system';
    try {
      const resolved = await fetchResolvedMethodPolicy(method, context);
      responses = responsesFromPolicy(method, resolved.data);
      source = resolved.data.find((item) => item.effective_source === 'project')
        ? 'project'
        : resolved.data.find((item) => item.effective_source === 'company')
          ? 'company'
          : 'system';
    } catch (error) {
      set({
        importStatus: {
          type: 'error',
          message: `Method policy could not be loaded; APIForge used its built-in ${method} fallback set. ${error instanceof Error ? error.message : ''}`.trim(),
        },
      });
    }

    const newEndpoint = {
      ...newEndpointDefaults(path, method, '', responses),
      methodPolicy: { scope: source, appliedAt: new Date().toISOString() },
    };
    set({
      endpoints: [...endpoints, newEndpoint],
      endpointDrafts: endpointDrafts.filter((draft) => draft.path !== path),
      selectedEndpointId: newEndpoint.id,
      selectedEndpointDraftId: null,
    });
  },

  renamePath: (oldPath, newPath) => {
    if (oldPath === newPath) return;
    set((s) => ({
      endpoints: s.endpoints.map((e) => {
        if (e.path === oldPath) return { ...e, path: newPath };
        if (e.path.startsWith(`${oldPath}/`)) return { ...e, path: newPath + e.path.slice(oldPath.length) };
        return e;
      }),
      endpointDrafts: s.endpointDrafts.map((draft) =>
        draft.path === oldPath ? { ...draft, path: newPath } : draft,
      ),
    }));
  },

  deleteMethod: (id) =>
    set((s) => {
      const deleted = s.endpoints.find((endpoint) => endpoint.id === id);
      const remaining = s.endpoints.filter((e) => e.id !== id);
      const wasSelected = s.selectedEndpointId === id;
      const pathStillHasMethod = deleted ? remaining.some((endpoint) => endpoint.path === deleted.path) : true;
      const draft = deleted && !pathStillHasMethod ? { id: makeId('path'), path: deleted.path } : null;
      return {
        endpoints: remaining,
        endpointDrafts: draft ? [...s.endpointDrafts, draft] : s.endpointDrafts,
        selectedEndpointId: wasSelected ? (remaining[0]?.id ?? null) : s.selectedEndpointId,
        selectedEndpointDraftId: wasSelected && draft ? draft.id : s.selectedEndpointDraftId,
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
          ? { ...e, params: [...e.params, makeParam(makeId('pm'), '')] }
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
        e.id === id ? { ...e, headers: [...e.headers, makeHeaderParam(makeId('hd'), '')] } : e,
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

  addResponse: (id) => {
    const responseId = makeId('res');
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id ? { ...e, responses: [...e.responses, makeResponseEntry(responseId, '200')] } : e,
      ),
    }));
    void get().applyResponseHeaderPolicy(id, responseId, 200);
  },
  addResponseForClass: (id, cls) => {
    const responseId = makeId('res');
    const code = DEFAULT_CODE_FOR_CLASS[cls];
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id ? { ...e, responses: [...e.responses, makeResponseEntry(responseId, code)] } : e,
      ),
    }));
    void get().applyResponseHeaderPolicy(id, responseId, Number(code));
  },
  setResponse: (id, responseId, patch) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id
          ? {
              ...e,
              responses: e.responses.map((r) =>
                r.id === responseId
                  ? {
                      ...r,
                      ...patch,
                      ...(('schema' in patch || 'schemaIsArray' in patch)
                        ? { headerPolicyStatusCode: undefined, headerPolicyError: null }
                        : {}),
                    }
                  : r,
              ),
            }
          : e,
      ),
    })),
  setResponseCodeWithHeaderPolicy: async (id, responseId, code) => {
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id
          ? {
              ...e,
              responses: e.responses.map((r) =>
                r.id === responseId
                  ? { ...r, code, headerPolicyStatusCode: undefined, headerPolicyError: null, headerPolicies: undefined }
                  : r,
              ),
            }
          : e,
      ),
    }));

    const statusCode = Number(code);
    if (Number.isInteger(statusCode) && statusCode >= 100 && statusCode <= 599) {
      await get().applyResponseHeaderPolicy(id, responseId, statusCode);
    }
  },
  applyResponseHeaderPolicy: async (id, responseId, statusCode) => {
    try {
      const response = await fetchResponseHeaderPolicy(statusCode);
      set((s) => ({
        endpoints: s.endpoints.map((e) =>
          e.id === id
            ? {
                ...e,
                responses: e.responses.map((r) =>
                  r.id === responseId ? mergeResponseHeaderPolicy(r, statusCode, response.data) : r,
                ),
              }
            : e,
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set((s) => ({
        endpoints: s.endpoints.map((e) =>
          e.id === id
            ? {
                ...e,
                responses: e.responses.map((r) =>
                  r.id === responseId ? { ...r, headerPolicyError: message } : r,
                ),
              }
            : e,
        ),
      }));
    }
  },
  removeResponse: (id, responseId) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id ? { ...e, responses: e.responses.filter((r) => r.id !== responseId) } : e,
      ),
    })),

  addResponseHeader: (id, responseId, headerName = '') =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id
          ? {
              ...e,
              responses: e.responses.map((r) => {
                if (r.id !== responseId) return r;
                if (headerName && r.headers.some((header) => normalizedHeaderName(header.name) === normalizedHeaderName(headerName))) {
                  return r;
                }
                const policy = r.headerPolicies?.find(
                  (item) => normalizedHeaderName(item.headerName) === normalizedHeaderName(headerName),
                );
                const header = policy
                  ? makeHeaderParam(makeId('hd'), policy.headerName, {
                      required: policy.policyCode === 'required',
                      mandated: policy.policyCode === 'required',
                      example: policy.defaultValueTemplate ?? policy.exampleValue ?? '',
                      policyCode: policy.policyCode,
                      policyConditionCode: policy.conditionCode,
                      policyRationale: policy.rationale,
                      catalogCode: policy.headerCode,
                      policyAutoAdded: false,
                    })
                  : makeHeaderParam(makeId('hd'), headerName);
                return { ...r, headers: [...r.headers, header] };
              }),
            }
          : e,
      ),
    })),
  setResponseHeader: (id, responseId, headerId, patch) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id
          ? {
              ...e,
              responses: e.responses.map((r) =>
                r.id === responseId
                  ? {
                      ...r,
                      headers: r.headers.map((h) =>
                        h.id === headerId
                          ? h.mandated
                            ? { ...h, ...patch, name: h.name, required: true, mandated: true }
                            : patch.name && r.headerPolicies?.some(
                                  (policy) =>
                                    policy.policyCode === 'forbidden' &&
                                    normalizedHeaderName(policy.headerName) === normalizedHeaderName(patch.name ?? ''),
                                )
                              ? h
                              : { ...h, ...patch, policyAutoAdded: false }
                          : h,
                      ),
                    }
                  : r,
              ),
            }
          : e,
      ),
    })),
  removeResponseHeader: (id, responseId, headerId) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id
          ? {
              ...e,
              responses: e.responses.map((r) =>
                r.id === responseId
                  ? { ...r, headers: r.headers.filter((h) => h.id !== headerId || h.mandated) }
                  : r,
              ),
            }
          : e,
      ),
    })),
  toggleResponseContentType: (id, responseId, contentType) =>
    set((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id
          ? {
              ...e,
              responses: e.responses.map((r) => {
                if (r.id !== responseId) return r;
                const has = r.contentTypes.includes(contentType);
                const next = has
                  ? r.contentTypes.filter((ct) => ct !== contentType)
                  : [...r.contentTypes, contentType];
                return { ...r, contentTypes: next.length ? next : ['application/json'] };
              }),
            }
          : e,
      ),
    })),

  expandedParamKey: null,
  toggleParamExpanded: (id) =>
    set((s) => ({ expandedParamKey: s.expandedParamKey === id ? null : id })),

  responseActiveClass: {},
  setResponseActiveClass: (endpointId, cls) =>
    set((s) => ({ responseActiveClass: { ...s.responseActiveClass, [endpointId]: cls } })),

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

  enabledSecuritySchemes: [],
  securityScopes: {},
  applySecurityDraft: (enabledSecuritySchemes, securityScopes, removedLegacySchemes) =>
    set((s) => {
      const turnedOff = s.enabledSecuritySchemes.filter((n) => !enabledSecuritySchemes.includes(n));
      const stripNames = new Set([...turnedOff, ...removedLegacySchemes]);
      return {
        enabledSecuritySchemes,
        securityScopes,
        endpoints:
          stripNames.size === 0
            ? s.endpoints
            : s.endpoints.map((e) =>
                e.security.some((sc) => stripNames.has(sc))
                  ? { ...e, security: e.security.filter((sc) => !stripNames.has(sc)) }
                  : e,
              ),
      };
    }),

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
  setPanelWidth: (w) => set({ panelWidth: clamp(EP_PANEL_MIN_WIDTH, EP_PANEL_MAX_WIDTH, w) }),
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
  selectedSchemaId: null,
  selectSchema: (id) => set({ selectedSchemaId: id }),
  addSchema: () => {
    const { schemas } = get();
    const name = uniqueSchemaName(
      schemas.map((s) => s.name),
      'NewSchema',
    );
    const newSchema: Schema = { id: makeId('sc'), name, fields: [], contentTypes: ['application/json'] };
    set({ schemas: [...schemas, newSchema], selectedSchemaId: newSchema.id });
  },
  addSchemaReturningName: () => {
    const { schemas } = get();
    const name = uniqueSchemaName(
      schemas.map((s) => s.name),
      'NewSchema',
    );
    const newSchema: Schema = { id: makeId('sc'), name, fields: [], contentTypes: ['application/json'] };
    set({ schemas: [...schemas, newSchema] });
    return name;
  },
  setSchemaName: (schemaId, name) =>
    set((s) => ({ schemas: s.schemas.map((sc) => (sc.id === schemaId ? { ...sc, name } : sc)) })),
  deleteSchema: (schemaId) =>
    set((s) => {
      const remaining = s.schemas.filter((sc) => sc.id !== schemaId);
      const wasSelected = s.selectedSchemaId === schemaId;
      return { schemas: remaining, selectedSchemaId: wasSelected ? (remaining[0]?.id ?? null) : s.selectedSchemaId };
    }),
  setScalarDescription: (schemaId, description) =>
    set((s) => ({
      schemas: s.schemas.map((sc) => (sc.id === schemaId ? { ...sc, scalarDescription: description } : sc)),
    })),
  toggleSchemaContentType: (schemaId, contentType) =>
    set((s) => ({
      schemas: s.schemas.map((sc) => {
        if (sc.id !== schemaId) return sc;
        const has = sc.contentTypes.includes(contentType);
        const next = has ? sc.contentTypes.filter((ct) => ct !== contentType) : [...sc.contentTypes, contentType];
        return { ...sc, contentTypes: next.length ? next : ['application/json'] };
      }),
    })),

  addBlankSchemaField: (schemaId) =>
    set((s) => ({
      schemas: s.schemas.map((sc) =>
        sc.id === schemaId ? { ...sc, fields: [...sc.fields, makeCustomField(makeId('sf'), '', 'string')] } : sc,
      ),
    })),
  setSchemaField: (schemaId, index, patch) =>
    set((s) => ({
      schemas: s.schemas.map((sc) => {
        if (sc.id !== schemaId) return sc;
        return {
          ...sc,
          fields: sc.fields.map((f, i) => {
            if (i !== index) return f;
            if (f.kind === 'custom') return { ...f, ...patch };
            // ref/primitive kinds only expose name + example generically — other patch keys
            // (format, pattern, etc.) don't apply to them since their type/format are locked.
            return {
              ...f,
              ...(patch.name !== undefined ? { name: patch.name } : {}),
              ...(patch.example !== undefined ? { example: patch.example } : {}),
            };
          }),
        };
      }),
    })),
  setSchemaFieldType: (schemaId, index, type) =>
    set((s) => ({
      schemas: s.schemas.map((sc) =>
        sc.id === schemaId ? { ...sc, fields: sc.fields.map((f, i) => (i === index ? { ...f, type } : f)) } : sc,
      ),
    })),
  setSchemaFieldItems: (schemaId, index, value) => {
    const isRef = value.startsWith('ref:');
    const name = value.slice(value.indexOf(':') + 1);
    set((s) => ({
      schemas: s.schemas.map((sc) => {
        if (sc.id !== schemaId) return sc;
        return {
          ...sc,
          fields: sc.fields.map((f, i) => {
            if (i !== index || f.kind !== 'custom') return f;
            return { ...f, itemsRef: isRef ? name : '', itemsType: isRef ? 'object' : (name as SchemaFieldType) };
          }),
        };
      }),
    }));
  },
  removeSchemaField: (schemaId, index) => {
    const { schemas } = get();
    const f = schemas.find((sc) => sc.id === schemaId)?.fields[index];
    if (f?.required) {
      set({ schemaToast: "Required properties can't be removed — toggle off Required first" });
      return;
    }
    set((s) => ({
      schemas: s.schemas.map((sc) => {
        if (sc.id !== schemaId) return sc;
        const fields = sc.fields.slice();
        const end = fieldSubtreeEnd(fields, index);
        fields.splice(index, end - index + 1);
        return { ...sc, fields };
      }),
    }));
  },
  toggleSchemaFieldRequired: (schemaId, index) =>
    set((s) => ({
      schemas: s.schemas.map((sc) =>
        sc.id === schemaId
          ? { ...sc, fields: sc.fields.map((f, i) => (i === index ? { ...f, required: !f.required } : f)) }
          : sc,
      ),
    })),
  toggleSchemaFieldNullable: (schemaId, index) =>
    set((s) => ({
      schemas: s.schemas.map((sc) =>
        sc.id === schemaId
          ? { ...sc, fields: sc.fields.map((f, i) => (i === index ? { ...f, nullable: !f.nullable } : f)) }
          : sc,
      ),
    })),
  indentSchemaField: (schemaId, index) =>
    set((s) => ({
      schemas: s.schemas.map((sc) => {
        if (sc.id !== schemaId) return sc;
        const fields = sc.fields.slice();
        const f = fields[index];
        if (!f || index === 0) return sc;
        const d = f.depth || 0;
        const prevDepth = fields[index - 1].depth || 0;
        if (prevDepth < d) return sc;
        let parentIdx = index - 1;
        while (parentIdx > 0 && (fields[parentIdx].depth || 0) > d) parentIdx--;
        if ((fields[parentIdx].depth || 0) !== d) return sc;
        const parent = fields[parentIdx];
        if (parent.kind === 'ref' || parent.kind === 'primitive') {
          fields[parentIdx] = makeCustomField(parent.id, parent.name, parent.type === 'array' ? 'array' : 'object', {
            required: parent.required,
            nullable: parent.nullable,
            depth: parent.depth,
          });
        } else if (parent.type !== 'array' && parent.type !== 'object') {
          fields[parentIdx] = { ...parent, type: 'object' };
        } else if (parent.type === 'array' && parent.itemsRef) {
          fields[parentIdx] = { ...parent, itemsRef: '', itemsType: 'object' };
        }
        const end = fieldSubtreeEnd(fields, index);
        for (let k = index; k <= end; k++) fields[k] = { ...fields[k], depth: (fields[k].depth || 0) + 1 };
        return { ...sc, fields };
      }),
    })),
  outdentSchemaField: (schemaId, index) =>
    set((s) => ({
      schemas: s.schemas.map((sc) => {
        if (sc.id !== schemaId) return sc;
        const fields = sc.fields.slice();
        const f = fields[index];
        if (!f) return sc;
        const d = f.depth || 0;
        if (d <= 0) return sc;
        const end = fieldSubtreeEnd(fields, index);
        for (let k = index; k <= end; k++) fields[k] = { ...fields[k], depth: Math.max(0, (fields[k].depth || 0) - 1) };
        return { ...sc, fields };
      }),
    })),

  expandedSchemaFieldKey: null,
  toggleSchemaFieldExpanded: (schemaId, index) =>
    set((s) => {
      const key = `${schemaId}:${index}`;
      return { expandedSchemaFieldKey: s.expandedSchemaFieldKey === key ? null : key };
    }),

  draggingSchemaFieldSchemaId: null,
  draggingSchemaFieldIndex: null,
  dragOverSchemaFieldIndex: null,
  startDragSchemaField: (schemaId, index) =>
    set({ draggingSchemaFieldSchemaId: schemaId, draggingSchemaFieldIndex: index }),
  setDragOverSchemaField: (schemaId, index) => {
    const { draggingSchemaFieldSchemaId: fromSchemaId, draggingSchemaFieldIndex: fromIdx, schemas } = get();
    if (fromSchemaId !== schemaId) return;
    const schema = schemas.find((sc) => sc.id === schemaId);
    if (schema && fromIdx != null) {
      const fields = schema.fields;
      const end = fieldSubtreeEnd(fields, fromIdx);
      const [start, sibEnd] = fieldSiblingBounds(fields, fromIdx);
      const fromDepth = fields[fromIdx]?.depth || 0;
      const toDepth = fields[index]?.depth || 0;
      if (index < start || index > sibEnd || toDepth !== fromDepth || (index >= fromIdx && index <= end)) {
        set({ dragOverSchemaFieldIndex: null });
        return;
      }
    }
    set({ dragOverSchemaFieldIndex: index });
  },
  clearDragOverSchemaField: () => set({ dragOverSchemaFieldIndex: null }),
  dropSchemaField: (schemaId, toIndex) => {
    const { draggingSchemaFieldSchemaId: fromSchemaId, draggingSchemaFieldIndex: fromIdx, schemas } = get();
    set({ draggingSchemaFieldSchemaId: null, draggingSchemaFieldIndex: null, dragOverSchemaFieldIndex: null });
    if (fromSchemaId !== schemaId || fromIdx == null || fromIdx === toIndex) return;
    const schema = schemas.find((sc) => sc.id === schemaId);
    if (!schema) return;
    const fields = schema.fields;
    const end = fieldSubtreeEnd(fields, fromIdx);
    if (toIndex >= fromIdx && toIndex <= end) return;
    const fromDepth = fields[fromIdx]?.depth || 0;
    const toDepth = fields[toIndex]?.depth || 0;
    const [start, sibEnd] = fieldSiblingBounds(fields, fromIdx);
    if (toDepth !== fromDepth || toIndex < start || toIndex > sibEnd) {
      set({ schemaToast: 'A property can only be reordered within its parent' });
      return;
    }
    const nextFields = fields.slice();
    const block = nextFields.splice(fromIdx, end - fromIdx + 1);
    const insertAt = toIndex > end ? toIndex - block.length : toIndex;
    nextFields.splice(insertAt, 0, ...block);
    set((s) => ({ schemas: s.schemas.map((sc) => (sc.id === schemaId ? { ...sc, fields: nextFields } : sc)) }));
  },
  endDragSchemaField: () =>
    set({ draggingSchemaFieldSchemaId: null, draggingSchemaFieldIndex: null, dragOverSchemaFieldIndex: null }),

  schemaToast: null,
  setSchemaToast: (message) => set({ schemaToast: message }),

  fieldPickerOpen: false,
  fieldPickerSchemaId: null,
  fieldPickerConvertIndex: null,
  fieldPickerMode: 'primitive',
  fieldPickerCategory: 'alpha',
  fieldPickerSearch: '',
  fieldPickerSelectedKey: null,
  openFieldPicker: (schemaId, convertIndex = null) =>
    set({
      fieldPickerOpen: true,
      fieldPickerSchemaId: schemaId,
      fieldPickerConvertIndex: convertIndex,
      fieldPickerMode: 'primitive',
      fieldPickerSearch: '',
      fieldPickerSelectedKey: null,
    }),
  closeFieldPicker: () =>
    set({
      fieldPickerOpen: false,
      fieldPickerSchemaId: null,
      fieldPickerConvertIndex: null,
      fieldPickerSelectedKey: null,
    }),
  setFieldPickerMode: (mode) =>
    set((s) => ({
      fieldPickerMode: mode,
      fieldPickerSelectedKey: null,
      customFieldDraft: mode === 'custom' ? { ...DEFAULT_CUSTOM_FIELD_DRAFT } : s.customFieldDraft,
    })),
  setFieldPickerCategory: (cat) => set({ fieldPickerCategory: cat, fieldPickerSelectedKey: null }),
  setFieldPickerSearch: (v) => set({ fieldPickerSearch: v }),
  selectFieldPickerPrimitive: (pkey) => set({ fieldPickerSelectedKey: pkey || null }),
  insertPrimitiveField: (pkey) => {
    const p = findPrimitive(pkey);
    const { fieldPickerSchemaId, fieldPickerConvertIndex, schemas } = get();
    if (!p || !fieldPickerSchemaId) return;
    const jsonType: SchemaFieldType = p.jsonType === 'null' ? 'string' : (p.jsonType as SchemaFieldType);
    let nextSchemas = schemas;
    const existing = schemas.find((sc) => sc.scalar && sc.scalarPrimitiveKey === p.key);
    let wrapperName: string;
    if (existing) {
      wrapperName = existing.name;
    } else {
      const base = p.key.charAt(0).toUpperCase() + p.key.slice(1);
      wrapperName = uniqueSchemaName(
        schemas.map((sc) => sc.name),
        base,
      );
      const wrapper: Schema = {
        id: makeId('sc'),
        name: wrapperName,
        scalar: true,
        fields: [],
        contentTypes: ['application/json'],
        scalarType: jsonType,
        scalarFormat: p.format ?? undefined,
        scalarPrimitiveKey: p.key,
        scalarDescription: p.description || '',
      };
      nextSchemas = [...schemas, wrapper];
    }
    nextSchemas = nextSchemas.map((sc) => {
      if (sc.id !== fieldPickerSchemaId) return sc;
      const fields = sc.fields.slice();
      if (fieldPickerConvertIndex != null && fields[fieldPickerConvertIndex]) {
        const old = fields[fieldPickerConvertIndex];
        fields[fieldPickerConvertIndex] = {
          id: old.id,
          name: old.name,
          kind: 'ref',
          ref: wrapperName,
          type: jsonType,
          required: old.required,
          nullable: old.nullable,
          depth: old.depth,
          example: '',
        };
        return { ...sc, fields };
      }
      const name = uniqueFieldName(
        fields.map((f) => f.name),
        p.key,
      );
      fields.push({
        id: makeId('sf'),
        name,
        kind: 'ref',
        ref: wrapperName,
        type: jsonType,
        required: false,
        nullable: false,
        depth: 0,
        example: '',
      });
      return { ...sc, fields };
    });
    set({
      schemas: nextSchemas,
      fieldPickerOpen: false,
      fieldPickerSchemaId: null,
      fieldPickerConvertIndex: null,
      fieldPickerSelectedKey: null,
    });
  },
  insertSchemaRefField: (schemaName) => {
    const { fieldPickerSchemaId, fieldPickerConvertIndex, schemas } = get();
    if (!fieldPickerSchemaId) return;
    const nextSchemas = schemas.map((sc) => {
      if (sc.id !== fieldPickerSchemaId) return sc;
      const fields = sc.fields.slice();
      if (fieldPickerConvertIndex != null && fields[fieldPickerConvertIndex]) {
        const old = fields[fieldPickerConvertIndex];
        fields[fieldPickerConvertIndex] = {
          id: old.id,
          name: old.name,
          kind: 'ref',
          ref: schemaName,
          type: 'object',
          required: old.required,
          nullable: old.nullable,
          depth: old.depth,
          example: '',
        };
        return { ...sc, fields };
      }
      const name = uniqueFieldName(
        fields.map((f) => f.name),
        schemaName.toLowerCase(),
      );
      fields.push({
        id: makeId('sf'),
        name,
        kind: 'ref',
        ref: schemaName,
        type: 'object',
        required: false,
        nullable: false,
        depth: 0,
        example: '',
      });
      return { ...sc, fields };
    });
    set({
      schemas: nextSchemas,
      fieldPickerOpen: false,
      fieldPickerSchemaId: null,
      fieldPickerConvertIndex: null,
      fieldPickerSelectedKey: null,
    });
  },

  customFieldDraft: DEFAULT_CUSTOM_FIELD_DRAFT,
  setCustomFieldDraft: (patch) => set((s) => ({ customFieldDraft: { ...s.customFieldDraft, ...patch } })),
  addCustomField: () => {
    const { fieldPickerSchemaId, customFieldDraft, schemas } = get();
    const name = customFieldDraft.name.trim();
    if (!fieldPickerSchemaId || !name) return;
    const schema = schemas.find((sc) => sc.id === fieldPickerSchemaId);
    if (!schema) return;
    const type = customFieldDraft.type;
    const extra: Partial<SchemaFieldCustom> = {
      required: customFieldDraft.required,
      nullable: customFieldDraft.nullable,
      format: customFieldDraft.format.trim() || undefined,
    };
    if (type === 'string') {
      if (customFieldDraft.pattern.trim()) extra.pattern = customFieldDraft.pattern.trim();
      if (customFieldDraft.minLength.trim() !== '') extra.minLength = customFieldDraft.minLength.trim();
      if (customFieldDraft.maxLength.trim() !== '') extra.maxLength = customFieldDraft.maxLength.trim();
      if (customFieldDraft.enumValues.trim()) extra.enumValues = customFieldDraft.enumValues.trim();
    }
    if (type === 'integer' || type === 'number') {
      if (customFieldDraft.min.trim() !== '') extra.min = customFieldDraft.min.trim();
      if (customFieldDraft.max.trim() !== '') extra.max = customFieldDraft.max.trim();
    }
    if (type === 'array') {
      const itemsVal = customFieldDraft.itemsValue;
      const isItemsRef = itemsVal.startsWith('ref:');
      extra.itemsType = isItemsRef ? 'object' : (itemsVal.slice(5) as SchemaFieldType);
      if (isItemsRef) extra.itemsRef = itemsVal.slice(4);
    }
    if (type !== 'array' && customFieldDraft.example.trim() !== '') extra.example = customFieldDraft.example.trim();
    const fieldName = uniqueFieldName(
      schema.fields.map((f) => f.name),
      name,
    );
    const newField = makeCustomField(makeId('sf'), fieldName, type, extra);
    set((s) => ({
      schemas: s.schemas.map((sc) =>
        sc.id === fieldPickerSchemaId ? { ...sc, fields: [...sc.fields, newField] } : sc,
      ),
      fieldPickerOpen: false,
      fieldPickerSchemaId: null,
      fieldPickerConvertIndex: null,
      customFieldDraft: DEFAULT_CUSTOM_FIELD_DRAFT,
    }));
  },

  schemaPanelSearch: '',
  setSchemaPanelSearch: (v) => set({ schemaPanelSearch: v }),
  schemaPanelWidth: SCHEMA_PANEL_DEFAULT_WIDTH,
  schemaPanelCollapsed: false,
  resizingSchemaPanel: false,
  setSchemaPanelWidth: (w) => set({ schemaPanelWidth: clamp(SCHEMA_PANEL_MIN_WIDTH, SCHEMA_PANEL_MAX_WIDTH, w) }),
  toggleSchemaPanelCollapsed: () => set((s) => ({ schemaPanelCollapsed: !s.schemaPanelCollapsed })),
  setResizingSchemaPanel: (v) => set({ resizingSchemaPanel: v }),

  schemaCompileFormat: 'json',
  setSchemaCompileFormat: (format) => set({ schemaCompileFormat: format }),
  compilePanelWidth: COMPILE_PANEL_DEFAULT_WIDTH,
  compilePanelCollapsed: false,
  resizingCompilePanel: false,
  setCompilePanelWidth: (w) =>
    set({ compilePanelWidth: clamp(COMPILE_PANEL_MIN_WIDTH, COMPILE_PANEL_MAX_WIDTH, w) }),
  toggleCompilePanelCollapsed: () => set((s) => ({ compilePanelCollapsed: !s.compilePanelCollapsed })),
  setResizingCompilePanel: (v) => set({ resizingCompilePanel: v }),

  restProjectionOutlineExpanded: {},
  toggleRestProjectionOutlineExpanded: (key) =>
    set((s) => {
      const current = s.restProjectionOutlineExpanded[key] ?? isOutlineGroupDefaultExpanded(key);
      return { restProjectionOutlineExpanded: { ...s.restProjectionOutlineExpanded, [key]: !current } };
    }),
  restProjectionOutlinePanelWidth: OUTLINE_PANEL_DEFAULT_WIDTH,
  restProjectionOutlinePanelCollapsed: false,
  resizingRestProjectionOutlinePanel: false,
  setRestProjectionOutlinePanelWidth: (w) =>
    set({ restProjectionOutlinePanelWidth: clamp(OUTLINE_PANEL_MIN_WIDTH, OUTLINE_PANEL_MAX_WIDTH, w) }),
  toggleRestProjectionOutlinePanelCollapsed: () =>
    set((s) => ({ restProjectionOutlinePanelCollapsed: !s.restProjectionOutlinePanelCollapsed })),
  setResizingRestProjectionOutlinePanel: (v) => set({ resizingRestProjectionOutlinePanel: v }),
  })),
);

export function methodsForPath(endpoints: Endpoint[], path: string): HttpMethod[] {
  return endpoints
    .filter((e) => e.path === path)
    .map((e) => e.method)
    .sort((a, b) => METHOD_PRIORITY.indexOf(a) - METHOD_PRIORITY.indexOf(b));
}

export {
  EP_PANEL_MIN_WIDTH,
  EP_PANEL_MAX_WIDTH,
  SCHEMA_PANEL_MIN_WIDTH,
  SCHEMA_PANEL_MAX_WIDTH,
  COMPILE_PANEL_MIN_WIDTH,
  COMPILE_PANEL_MAX_WIDTH,
  OUTLINE_PANEL_MIN_WIDTH,
  OUTLINE_PANEL_MAX_WIDTH,
};
