import {
  useSpecStore,
  methodsForPath,
  EP_PANEL_MIN_WIDTH,
  EP_PANEL_MAX_WIDTH,
  OUTLINE_PANEL_MIN_WIDTH,
  OUTLINE_PANEL_MAX_WIDTH,
} from './useSpecStore';
import type { Endpoint, Schema } from '../types/spec';

const initialState = useSpecStore.getState();

beforeEach(() => {
  useSpecStore.setState(initialState, true);
});

describe('useSpecStore', () => {
  it('starts with no document loaded', () => {
    const s = useSpecStore.getState();
    expect(s.hasDocument).toBe(false);
    expect(s.endpoints).toEqual([]);
    expect(s.schemas).toEqual([]);
  });

  it('loads the sample project', () => {
    useSpecStore.getState().loadSampleProject();
    const s = useSpecStore.getState();
    expect(s.hasDocument).toBe(true);
    expect(s.endpoints.length).toBeGreaterThan(0);
    expect(s.schemas.length).toBeGreaterThan(0);
    expect(s.selectedEndpointId).toBe(s.endpoints[0].id);
    expect(s.selectedSchemaId).toBe(s.schemas[0].id);
  });

  it('imports a parsed spec and resets panel UI state', () => {
    useSpecStore.setState({ panelSearch: 'foo', schemaPanelSearch: 'bar', expandedTags: { Users: true } });
    const endpoints: Endpoint[] = [
      {
        id: 'ep_x',
        path: '/things',
        method: 'GET',
        summary: '',
        operationId: '',
        tags: [],
        security: [],
        params: [],
        headers: [],
        requestBodyEnabled: false,
        requestBodyDescription: '',
        responses: [],
      },
    ];
    const schemas: Schema[] = [{ id: 'sc_x', name: 'Thing', fields: [], contentTypes: ['application/json'] }];
    useSpecStore.getState().importSpec({ endpoints, schemas });

    const s = useSpecStore.getState();
    expect(s.hasDocument).toBe(true);
    expect(s.endpoints).toEqual(endpoints);
    expect(s.schemas).toEqual(schemas);
    expect(s.selectedEndpointId).toBe('ep_x');
    expect(s.selectedSchemaId).toBe('sc_x');
    expect(s.panelSearch).toBe('');
    expect(s.schemaPanelSearch).toBe('');
    expect(s.expandedTags).toEqual({});
  });

  it('closeDocument resets back to the empty state, including panel UI state', () => {
    useSpecStore.getState().loadSampleProject();
    useSpecStore.setState({ panelSearch: 'foo', schemaPanelSearch: 'bar', expandedTags: { Users: true } });

    useSpecStore.getState().closeDocument();

    const s = useSpecStore.getState();
    expect(s.hasDocument).toBe(false);
    expect(s.endpoints).toEqual([]);
    expect(s.schemas).toEqual([]);
    expect(s.selectedEndpointId).toBeNull();
    expect(s.selectedSchemaId).toBeNull();
    expect(s.panelSearch).toBe('');
    expect(s.schemaPanelSearch).toBe('');
    expect(s.expandedTags).toEqual({});
    expect(s.enabledSecuritySchemes).toEqual([]);
  });

  it('adds a new endpoint with a unique default path and selects it', () => {
    useSpecStore.getState().addEndpoint();
    useSpecStore.getState().addEndpoint();
    const s = useSpecStore.getState();
    expect(s.endpoints).toHaveLength(2);
    expect(s.endpoints[0].path).toBe('/new-endpoint');
    expect(s.endpoints[1].path).toBe('/new-endpoint-2');
    expect(s.selectedEndpointId).toBe(s.endpoints[1].id);
  });

  it('pickMethod reuses an existing endpoint at the same path+method, otherwise creates one', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const firstId = useSpecStore.getState().endpoints[0].id;

    useSpecStore.getState().pickMethod('/users', 'GET');
    expect(useSpecStore.getState().endpoints).toHaveLength(1);
    expect(useSpecStore.getState().selectedEndpointId).toBe(firstId);

    useSpecStore.getState().pickMethod('/users', 'POST');
    expect(useSpecStore.getState().endpoints).toHaveLength(2);
    expect(useSpecStore.getState().selectedEndpointId).not.toBe(firstId);
  });

  it('deleteMethod removes the endpoint and reselects when the selected one is deleted', () => {
    useSpecStore.getState().pickMethod('/a', 'GET');
    useSpecStore.getState().pickMethod('/b', 'GET');
    const [first, second] = useSpecStore.getState().endpoints;

    useSpecStore.getState().selectEndpoint(first.id);
    useSpecStore.getState().deleteMethod(first.id);

    const s = useSpecStore.getState();
    expect(s.endpoints).toHaveLength(1);
    expect(s.selectedEndpointId).toBe(second.id);
  });

  it('deleteMethod leaves selection untouched when a different endpoint is deleted', () => {
    useSpecStore.getState().pickMethod('/a', 'GET');
    useSpecStore.getState().pickMethod('/b', 'GET');
    const [first, second] = useSpecStore.getState().endpoints;

    useSpecStore.getState().selectEndpoint(second.id);
    useSpecStore.getState().deleteMethod(first.id);

    expect(useSpecStore.getState().selectedEndpointId).toBe(second.id);
  });

  it('renamePath updates every method sharing the exact path', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    useSpecStore.getState().pickMethod('/users', 'POST');
    useSpecStore.getState().renamePath('/users', '/accounts');

    const paths = useSpecStore.getState().endpoints.map((e) => e.path);
    expect(paths).toEqual(['/accounts', '/accounts']);
  });

  it('renamePath cascades into descendant paths nested beneath the renamed one', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    useSpecStore.getState().pickMethod('/users/{id}', 'GET');
    useSpecStore.getState().pickMethod('/users-archive', 'GET');
    useSpecStore.getState().renamePath('/users', '/accounts');

    const paths = useSpecStore.getState().endpoints.map((e) => e.path);
    expect(paths).toEqual(['/accounts', '/accounts/{id}', '/users-archive']);
  });

  it('renamePath is a no-op when the path is unchanged', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    useSpecStore.getState().renamePath('/users', '/users');
    expect(useSpecStore.getState().endpoints[0].path).toBe('/users');
  });

  it('sets summary and operationId, and can generate operationId from path/method', () => {
    useSpecStore.getState().pickMethod('/users/{id}', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;

    useSpecStore.getState().setSummary(id, 'Get a user');
    useSpecStore.getState().setOperationId(id, 'custom');
    expect(useSpecStore.getState().endpoints[0].summary).toBe('Get a user');
    expect(useSpecStore.getState().endpoints[0].operationId).toBe('custom');

    useSpecStore.getState().generateOperationId(id);
    expect(useSpecStore.getState().endpoints[0].operationId).toBe('getUsersId');
  });

  it('adds, updates, and removes params', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;

    useSpecStore.getState().addParam(id);
    const param = useSpecStore.getState().endpoints[0].params[0];
    expect(param).toMatchObject({ required: false, nullable: false, example: '' });
    const paramId = param.id;
    useSpecStore.getState().setParam(id, paramId, { name: 'limit', in: 'query' });
    expect(useSpecStore.getState().endpoints[0].params[0]).toMatchObject({ name: 'limit', in: 'query' });

    useSpecStore.getState().removeParam(id, paramId);
    expect(useSpecStore.getState().endpoints[0].params).toHaveLength(0);
  });

  it('adds, updates, and removes headers', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;

    useSpecStore.getState().addHeader(id);
    const header = useSpecStore.getState().endpoints[0].headers[0];
    expect(header).toMatchObject({ required: false, nullable: false, example: '' });
    const headerId = header.id;
    useSpecStore.getState().setHeader(id, headerId, { name: 'X-Request-Id' });
    expect(useSpecStore.getState().endpoints[0].headers[0].name).toBe('X-Request-Id');

    useSpecStore.getState().removeHeader(id, headerId);
    expect(useSpecStore.getState().endpoints[0].headers).toHaveLength(0);
  });

  it('sets nullable and example on a param, and toggles its expanded-example panel', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;
    useSpecStore.getState().addParam(id);
    const paramId = useSpecStore.getState().endpoints[0].params[0].id;

    useSpecStore.getState().setParam(id, paramId, { nullable: true, example: '42' });
    expect(useSpecStore.getState().endpoints[0].params[0]).toMatchObject({ nullable: true, example: '42' });

    expect(useSpecStore.getState().expandedParamKey).toBeNull();
    useSpecStore.getState().toggleParamExpanded(paramId);
    expect(useSpecStore.getState().expandedParamKey).toBe(paramId);
    useSpecStore.getState().toggleParamExpanded(paramId);
    expect(useSpecStore.getState().expandedParamKey).toBeNull();
  });

  it('toggles the request body and updates its description', () => {
    useSpecStore.getState().pickMethod('/users', 'POST');
    const id = useSpecStore.getState().endpoints[0].id;

    expect(useSpecStore.getState().endpoints[0].requestBodyEnabled).toBe(false);
    useSpecStore.getState().toggleRequestBody(id);
    expect(useSpecStore.getState().endpoints[0].requestBodyEnabled).toBe(true);

    useSpecStore.getState().setRequestBodyDescription(id, 'User payload');
    expect(useSpecStore.getState().endpoints[0].requestBodyDescription).toBe('User payload');
  });

  it('adds, updates, and removes responses', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;
    const initialCount = useSpecStore.getState().endpoints[0].responses.length;

    useSpecStore.getState().addResponse(id);
    const responses = useSpecStore.getState().endpoints[0].responses;
    expect(responses).toHaveLength(initialCount + 1);
    const newResponseId = responses[responses.length - 1].id;

    useSpecStore.getState().setResponse(id, newResponseId, { code: '204', description: 'No Content' });
    const updated = useSpecStore.getState().endpoints[0].responses.find((r) => r.id === newResponseId);
    expect(updated).toMatchObject({ code: '204', description: 'No Content' });

    useSpecStore.getState().removeResponse(id, newResponseId);
    expect(useSpecStore.getState().endpoints[0].responses).toHaveLength(initialCount);
  });

  it('adds the next unused response code for a selected status class', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;

    useSpecStore.getState().addResponseForClass(id, '2xx');
    let responses = useSpecStore.getState().endpoints[0].responses;
    expect(responses[responses.length - 1].code).toBe('201');

    useSpecStore.getState().addResponseForClass(id, '2xx');
    responses = useSpecStore.getState().endpoints[0].responses;
    expect(responses[responses.length - 1].code).toBe('202');

    useSpecStore.getState().addResponseForClass(id, '4xx');
    responses = useSpecStore.getState().endpoints[0].responses;
    expect(responses[responses.length - 1].code).toBe('400');

    useSpecStore.getState().addResponseForClass(id, '4xx');
    responses = useSpecStore.getState().endpoints[0].responses;
    expect(responses[responses.length - 1].code).toBe('401');
  });

  it('fills the first available gap in the configured response-code sequence', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;

    useSpecStore.getState().addResponseForClass(id, '2xx');
    let responses = useSpecStore.getState().endpoints[0].responses;
    const addedId = responses[responses.length - 1].id;
    useSpecStore.getState().setResponse(id, addedId, { code: '204' });

    useSpecStore.getState().addResponseForClass(id, '2xx');
    responses = useSpecStore.getState().endpoints[0].responses;
    expect(responses[responses.length - 1].code).toBe('201');
  });

  it('tracks the active response status class per endpoint', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const idA = useSpecStore.getState().endpoints[0].id;
    useSpecStore.getState().pickMethod('/posts', 'GET');
    const idB = useSpecStore.getState().endpoints[1].id;

    useSpecStore.getState().setResponseActiveClass(idA, '4xx');
    useSpecStore.getState().setResponseActiveClass(idB, '5xx');

    const s = useSpecStore.getState();
    expect(s.responseActiveClass[idA]).toBe('4xx');
    expect(s.responseActiveClass[idB]).toBe('5xx');
  });

  it('new responses default to an empty headers array and a single content-type', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;

    useSpecStore.getState().addResponseForClass(id, '4xx');
    const responses = useSpecStore.getState().endpoints[0].responses;
    const added = responses[responses.length - 1];
    expect(added.headers).toEqual([]);
    expect(added.contentTypes).toEqual(['application/json']);
    expect(added.schema).toBe('');
    expect(added.schemaIsArray).toBe(false);
  });

  it('adds, updates, and removes a response header without affecting other responses', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;
    const responseId = useSpecStore.getState().endpoints[0].responses[0].id;

    useSpecStore.getState().addResponseHeader(id, responseId);
    const headers = useSpecStore.getState().endpoints[0].responses[0].headers;
    expect(headers).toHaveLength(1);
    const headerId = headers[0].id;

    useSpecStore.getState().setResponseHeader(id, responseId, headerId, { name: 'X-Request-Id', required: true });
    const updated = useSpecStore.getState().endpoints[0].responses[0].headers[0];
    expect(updated).toMatchObject({ name: 'X-Request-Id', required: true });

    useSpecStore.getState().removeResponseHeader(id, responseId, headerId);
    expect(useSpecStore.getState().endpoints[0].responses[0].headers).toHaveLength(0);
  });

  it('toggles response content-types, never leaving the list empty', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;
    const responseId = useSpecStore.getState().endpoints[0].responses[0].id;

    useSpecStore.getState().toggleResponseContentType(id, responseId, 'application/xml');
    expect(useSpecStore.getState().endpoints[0].responses[0].contentTypes).toEqual([
      'application/json',
      'application/xml',
    ]);

    useSpecStore.getState().toggleResponseContentType(id, responseId, 'application/json');
    expect(useSpecStore.getState().endpoints[0].responses[0].contentTypes).toEqual(['application/xml']);

    // Removing the last remaining content-type falls back to application/json instead of leaving it empty.
    useSpecStore.getState().toggleResponseContentType(id, responseId, 'application/xml');
    expect(useSpecStore.getState().endpoints[0].responses[0].contentTypes).toEqual(['application/json']);
  });

  it('adds and removes security schemes without duplicates', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;

    useSpecStore.getState().addSecurity(id, 'bearerAuth');
    useSpecStore.getState().addSecurity(id, 'bearerAuth');
    expect(useSpecStore.getState().endpoints[0].security).toEqual(['bearerAuth']);

    useSpecStore.getState().removeSecurity(id, 'bearerAuth');
    expect(useSpecStore.getState().endpoints[0].security).toEqual([]);
  });

  it('toggles a tag on an endpoint on and off', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;

    useSpecStore.getState().toggleEndpointTag(id, 'Users');
    expect(useSpecStore.getState().endpoints[0].tags).toEqual(['Users']);

    useSpecStore.getState().toggleEndpointTag(id, 'Users');
    expect(useSpecStore.getState().endpoints[0].tags).toEqual([]);
  });

  it('clamps the endpoints panel width between min and max', () => {
    useSpecStore.getState().setPanelWidth(EP_PANEL_MIN_WIDTH - 100);
    expect(useSpecStore.getState().panelWidth).toBe(EP_PANEL_MIN_WIDTH);

    useSpecStore.getState().setPanelWidth(EP_PANEL_MAX_WIDTH + 100);
    expect(useSpecStore.getState().panelWidth).toBe(EP_PANEL_MAX_WIDTH);
  });

  it('clamps the REST Projection outline panel width, and toggles its collapsed/resizing state', () => {
    useSpecStore.getState().setRestProjectionOutlinePanelWidth(OUTLINE_PANEL_MIN_WIDTH - 100);
    expect(useSpecStore.getState().restProjectionOutlinePanelWidth).toBe(OUTLINE_PANEL_MIN_WIDTH);

    useSpecStore.getState().setRestProjectionOutlinePanelWidth(OUTLINE_PANEL_MAX_WIDTH + 100);
    expect(useSpecStore.getState().restProjectionOutlinePanelWidth).toBe(OUTLINE_PANEL_MAX_WIDTH);

    expect(useSpecStore.getState().restProjectionOutlinePanelCollapsed).toBe(false);
    useSpecStore.getState().toggleRestProjectionOutlinePanelCollapsed();
    expect(useSpecStore.getState().restProjectionOutlinePanelCollapsed).toBe(true);

    expect(useSpecStore.getState().resizingRestProjectionOutlinePanel).toBe(false);
    useSpecStore.getState().setResizingRestProjectionOutlinePanel(true);
    expect(useSpecStore.getState().resizingRestProjectionOutlinePanel).toBe(true);
  });

  it('toggles REST Projection outline nodes from their per-key default (general/components start expanded, others start collapsed), independently of each other', () => {
    expect(useSpecStore.getState().restProjectionOutlineExpanded.tags).toBeUndefined();
    expect(useSpecStore.getState().restProjectionOutlineExpanded.general).toBeUndefined();

    // Tags starts collapsed — first toggle expands it.
    useSpecStore.getState().toggleRestProjectionOutlineExpanded('tags');
    expect(useSpecStore.getState().restProjectionOutlineExpanded.tags).toBe(true);
    expect(useSpecStore.getState().restProjectionOutlineExpanded.paths).toBeUndefined();

    useSpecStore.getState().toggleRestProjectionOutlineExpanded('tags');
    expect(useSpecStore.getState().restProjectionOutlineExpanded.tags).toBe(false);

    // General starts expanded — first toggle collapses it.
    useSpecStore.getState().toggleRestProjectionOutlineExpanded('general');
    expect(useSpecStore.getState().restProjectionOutlineExpanded.general).toBe(false);
  });

  it('adds a schema with a unique auto-generated name', () => {
    useSpecStore.getState().addSchema();
    useSpecStore.getState().addSchema();
    const s = useSpecStore.getState();
    expect(s.schemas.map((sc) => sc.name)).toEqual(['NewSchema', 'NewSchema2']);
    expect(s.selectedSchemaId).toBe(s.schemas[1].id);
  });

  it('adds a schema without changing selection, returning its name', () => {
    useSpecStore.setState({ selectedSchemaId: 'sc_x' });
    const name = useSpecStore.getState().addSchemaReturningName();
    const s = useSpecStore.getState();
    expect(name).toBe('NewSchema');
    expect(s.schemas.map((sc) => sc.name)).toEqual(['NewSchema']);
    expect(s.selectedSchemaId).toBe('sc_x');
  });

  it('drops a dragged method onto a tag it does not already have', () => {
    useSpecStore.getState().pickMethod('/posts', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;

    useSpecStore.getState().startDragMethod(id);
    useSpecStore.getState().setDragOverTag('Posts');
    useSpecStore.getState().dropMethodOnTag('Posts');

    const s = useSpecStore.getState();
    expect(s.endpoints[0].tags).toEqual(['Posts']);
    expect(s.draggingMethodId).toBeNull();
    expect(s.dragOverTagKey).toBeNull();
  });
});

describe('schema field operations', () => {
  function setupSchema(): string {
    useSpecStore.getState().addSchema();
    return useSpecStore.getState().schemas[0].id;
  }

  it('renames a schema and deletes it, falling back selection to the next schema', () => {
    const id = setupSchema();
    useSpecStore.getState().setSchemaName(id, 'User');
    expect(useSpecStore.getState().schemas[0].name).toBe('User');

    useSpecStore.getState().addSchema();
    useSpecStore.getState().deleteSchema(id);
    const s = useSpecStore.getState();
    expect(s.schemas.map((sc) => sc.name)).toEqual(['NewSchema']);
    expect(s.selectedSchemaId).toBe(s.schemas[0].id);
  });

  it('adds a blank field directly to the end of the list, without opening the field picker', () => {
    const id = setupSchema();
    useSpecStore.getState().openFieldPicker(id);
    useSpecStore.getState().setCustomFieldDraft({ name: 'id' });
    useSpecStore.getState().addCustomField();

    useSpecStore.getState().addBlankSchemaField(id);
    const s = useSpecStore.getState();
    expect(s.schemas[0].fields.map((f) => f.name)).toEqual(['id', '']);
    expect(s.schemas[0].fields[1]).toMatchObject({ kind: 'custom', type: 'string', required: false });
    expect(s.fieldPickerOpen).toBe(false);
  });

  it('adds a custom field via the picker draft and appends it to the schema', () => {
    const id = setupSchema();
    useSpecStore.getState().openFieldPicker(id);
    useSpecStore.getState().setCustomFieldDraft({ name: 'age', type: 'integer', min: '0' });
    useSpecStore.getState().addCustomField();

    const s = useSpecStore.getState();
    expect(s.fieldPickerOpen).toBe(false);
    expect(s.schemas[0].fields).toHaveLength(1);
    const field = s.schemas[0].fields[0];
    expect(field).toMatchObject({ name: 'age', kind: 'custom', type: 'integer', min: '0', required: true });
  });

  it('inserting a primitive creates a wrapper scalar schema and a $ref field, reusing the wrapper on a second insert', () => {
    const id = setupSchema();
    useSpecStore.getState().openFieldPicker(id);
    useSpecStore.getState().insertPrimitiveField('slug');

    let s = useSpecStore.getState();
    expect(s.schemas).toHaveLength(2);
    const wrapper = s.schemas.find((sc) => sc.name === 'Slug');
    expect(wrapper?.scalar).toBe(true);
    expect(wrapper?.scalarPrimitiveKey).toBe('slug');
    const schema = s.schemas.find((sc) => sc.id === id)!;
    expect(schema.fields[0]).toMatchObject({ kind: 'ref', ref: 'Slug', name: 'slug' });

    // Inserting the same primitive again reuses the existing wrapper schema instead of creating a new one.
    useSpecStore.getState().openFieldPicker(id);
    useSpecStore.getState().insertPrimitiveField('slug');
    s = useSpecStore.getState();
    expect(s.schemas.filter((sc) => sc.name === 'Slug')).toHaveLength(1);
    expect(s.schemas.find((sc) => sc.id === id)!.fields).toHaveLength(2);
  });

  it('allows overriding the example on a $ref field, but ignores patch keys that only apply to custom fields', () => {
    const id = setupSchema();
    useSpecStore.getState().openFieldPicker(id);
    useSpecStore.getState().insertPrimitiveField('slug');

    useSpecStore.getState().setSchemaField(id, 0, { example: 'custom-slug', format: 'should-be-ignored' });
    const field = useSpecStore.getState().schemas.find((sc) => sc.id === id)!.fields[0];
    expect(field).toMatchObject({ kind: 'ref', example: 'custom-slug' });
    expect(field).not.toHaveProperty('format');
  });

  it('inserts a $ref field pointing at another schema by name', () => {
    const id = setupSchema();
    useSpecStore.getState().setSchemaName(id, 'User');
    useSpecStore.getState().addSchema();
    const otherId = useSpecStore.getState().schemas[1].id;
    useSpecStore.getState().setSchemaName(otherId, 'Address');

    useSpecStore.getState().openFieldPicker(id);
    useSpecStore.getState().insertSchemaRefField('Address');

    const s = useSpecStore.getState();
    const user = s.schemas.find((sc) => sc.id === id)!;
    expect(user.fields[0]).toMatchObject({ kind: 'ref', ref: 'Address', name: 'address', type: 'object' });
  });

  it('toggles required/nullable and blocks removing a required field', () => {
    const id = setupSchema();
    useSpecStore.getState().openFieldPicker(id);
    useSpecStore.getState().setCustomFieldDraft({ name: 'id' });
    useSpecStore.getState().addCustomField();

    // Custom fields default to required: true via the picker draft.
    let s = useSpecStore.getState();
    expect(s.schemas[0].fields[0]).toMatchObject({ required: true, nullable: false });

    useSpecStore.getState().toggleSchemaFieldNullable(id, 0);
    expect(useSpecStore.getState().schemas[0].fields[0].nullable).toBe(true);

    useSpecStore.getState().removeSchemaField(id, 0);
    s = useSpecStore.getState();
    expect(s.schemas[0].fields).toHaveLength(1);
    expect(s.schemaToast).toMatch(/can't be removed/);

    useSpecStore.getState().toggleSchemaFieldRequired(id, 0);
    useSpecStore.getState().removeSchemaField(id, 0);
    expect(useSpecStore.getState().schemas[0].fields).toHaveLength(0);
  });

  it('indents a field under its preceding sibling and outdents it back', () => {
    const id = setupSchema();
    useSpecStore.getState().openFieldPicker(id);
    useSpecStore.getState().setCustomFieldDraft({ name: 'meta', type: 'object' });
    useSpecStore.getState().addCustomField();
    useSpecStore.getState().openFieldPicker(id);
    useSpecStore.getState().setCustomFieldDraft({ name: 'page', type: 'integer' });
    useSpecStore.getState().addCustomField();

    useSpecStore.getState().indentSchemaField(id, 1);
    let s = useSpecStore.getState();
    expect(s.schemas[0].fields.map((f) => f.depth)).toEqual([0, 1]);

    useSpecStore.getState().outdentSchemaField(id, 1);
    s = useSpecStore.getState();
    expect(s.schemas[0].fields.map((f) => f.depth)).toEqual([0, 0]);
  });

  it('reorders same-depth siblings via drag and drop', () => {
    const id = setupSchema();
    ['a', 'b', 'c'].forEach((name) => {
      useSpecStore.getState().openFieldPicker(id);
      useSpecStore.getState().setCustomFieldDraft({ name });
      useSpecStore.getState().addCustomField();
    });

    // Dropping the first row onto the last row's position inserts it just before that row.
    useSpecStore.getState().startDragSchemaField(id, 0);
    useSpecStore.getState().dropSchemaField(id, 2);
    const s = useSpecStore.getState();
    expect(s.schemas[0].fields.map((f) => f.name)).toEqual(['b', 'a', 'c']);
    expect(s.draggingSchemaFieldSchemaId).toBeNull();
  });

  it('toggles a schema content type, always keeping at least one', () => {
    const id = setupSchema();
    useSpecStore.getState().toggleSchemaContentType(id, 'application/xml');
    let s = useSpecStore.getState();
    expect(s.schemas[0].contentTypes).toEqual(['application/json', 'application/xml']);

    useSpecStore.getState().toggleSchemaContentType(id, 'application/json');
    useSpecStore.getState().toggleSchemaContentType(id, 'application/xml');
    s = useSpecStore.getState();
    expect(s.schemas[0].contentTypes).toEqual(['application/json']);
  });
});

describe('security schemes', () => {
  it('applySecurityDraft enables a scheme, and later disabling it cascades removal from every endpoint', () => {
    useSpecStore.getState().pickMethod('/a', 'GET');
    useSpecStore.getState().pickMethod('/b', 'GET');
    const [epA, epB] = useSpecStore.getState().endpoints;

    useSpecStore.getState().applySecurityDraft(['bearerAuth'], {}, []);
    useSpecStore.getState().addSecurity(epA.id, 'bearerAuth');
    useSpecStore.getState().addSecurity(epB.id, 'bearerAuth');
    let s = useSpecStore.getState();
    expect(s.enabledSecuritySchemes).toEqual(['bearerAuth']);
    expect(s.endpoints.every((e) => e.security.includes('bearerAuth'))).toBe(true);

    useSpecStore.getState().applySecurityDraft([], {}, []);
    s = useSpecStore.getState();
    expect(s.enabledSecuritySchemes).toEqual([]);
    expect(s.endpoints.every((e) => e.security.length === 0)).toBe(true);
  });

  it('applySecurityDraft stores per-scheme scopes independently of the enabled list', () => {
    useSpecStore.getState().applySecurityDraft([], { oauth2: 'read:things, write:things' }, []);
    expect(useSpecStore.getState().securityScopes.oauth2).toBe('read:things, write:things');
  });

  it('applySecurityDraft removes a legacy scheme from every endpoint without touching the enabled catalog list', () => {
    useSpecStore.getState().pickMethod('/a', 'GET');
    const ep = useSpecStore.getState().endpoints[0];
    useSpecStore.getState().addSecurity(ep.id, 'customLegacyScheme');

    useSpecStore.getState().applySecurityDraft([], {}, ['customLegacyScheme']);
    const s = useSpecStore.getState();
    expect(s.endpoints[0].security).toEqual([]);
    expect(s.enabledSecuritySchemes).toEqual([]);
  });

  it('applySecurityDraft is a no-op on endpoints when nothing enabled/removed changed', () => {
    useSpecStore.getState().pickMethod('/a', 'GET');
    useSpecStore.getState().applySecurityDraft(['bearerAuth'], {}, []);
    const ep = useSpecStore.getState().endpoints[0];
    useSpecStore.getState().addSecurity(ep.id, 'bearerAuth');

    // Re-applying the same enabled list (nothing turned off, nothing legacy-removed) must not
    // touch any endpoint's security array.
    useSpecStore.getState().applySecurityDraft(['bearerAuth'], { bearerAuth: 'read' }, []);
    const s = useSpecStore.getState();
    expect(s.endpoints[0].security).toEqual(['bearerAuth']);
    expect(s.securityScopes.bearerAuth).toBe('read');
  });

  it('seeds enabledSecuritySchemes with bearerAuth when loading the sample project', () => {
    useSpecStore.getState().loadSampleProject();
    expect(useSpecStore.getState().enabledSecuritySchemes).toEqual(['bearerAuth']);
  });

  it('resets security scheme state on import', () => {
    useSpecStore.setState({ enabledSecuritySchemes: ['bearerAuth'], securityScopes: { oauth2: 'read' } });
    useSpecStore.getState().importSpec({ endpoints: [], schemas: [] });
    const s = useSpecStore.getState();
    expect(s.enabledSecuritySchemes).toEqual([]);
    expect(s.securityScopes).toEqual({});
  });
});

describe('cross-tab selection persistence', () => {
  it('remembers the selected endpoint independently of the selected schema', () => {
    useSpecStore.getState().pickMethod('/a', 'GET');
    useSpecStore.getState().pickMethod('/b', 'GET');
    const [first, second] = useSpecStore.getState().endpoints;
    useSpecStore.getState().selectEndpoint(first.id);

    useSpecStore.getState().addSchema();
    useSpecStore.getState().addSchema();
    const schemaId = useSpecStore.getState().schemas[1].id;
    useSpecStore.getState().selectSchema(schemaId);

    // Selecting a schema (as if the user switched to Schema Designer) must not
    // disturb the endpoint Design Canvas had selected, and vice versa.
    let s = useSpecStore.getState();
    expect(s.selectedEndpointId).toBe(first.id);
    expect(s.selectedSchemaId).toBe(schemaId);

    useSpecStore.getState().selectEndpoint(second.id);
    s = useSpecStore.getState();
    expect(s.selectedEndpointId).toBe(second.id);
    expect(s.selectedSchemaId).toBe(schemaId);
  });
});

describe('methodsForPath', () => {
  it('returns methods for a path ordered by method priority', () => {
    const endpoints: Endpoint[] = [
      { id: '1', path: '/x', method: 'DELETE' } as Endpoint,
      { id: '2', path: '/x', method: 'GET' } as Endpoint,
      { id: '3', path: '/y', method: 'POST' } as Endpoint,
      { id: '4', path: '/x', method: 'POST' } as Endpoint,
    ];
    expect(methodsForPath(endpoints, '/x')).toEqual(['GET', 'POST', 'DELETE']);
    expect(methodsForPath(endpoints, '/y')).toEqual(['POST']);
    expect(methodsForPath(endpoints, '/missing')).toEqual([]);
  });
});
