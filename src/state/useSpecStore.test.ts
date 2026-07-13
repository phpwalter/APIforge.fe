import { useSpecStore, methodsForPath, EP_PANEL_MIN_WIDTH, EP_PANEL_MAX_WIDTH } from './useSpecStore';
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
    expect(s.selectedId).toBe(s.endpoints[0].id);
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
    const schemas: Schema[] = [{ id: 'sc_x', name: 'Thing', fieldCount: 1 }];
    useSpecStore.getState().importSpec({ endpoints, schemas });

    const s = useSpecStore.getState();
    expect(s.hasDocument).toBe(true);
    expect(s.endpoints).toEqual(endpoints);
    expect(s.schemas).toEqual(schemas);
    expect(s.selectedId).toBe('ep_x');
    expect(s.panelSearch).toBe('');
    expect(s.schemaPanelSearch).toBe('');
    expect(s.expandedTags).toEqual({});
  });

  it('adds a new endpoint with a unique default path and selects it', () => {
    useSpecStore.getState().addEndpoint();
    useSpecStore.getState().addEndpoint();
    const s = useSpecStore.getState();
    expect(s.endpoints).toHaveLength(2);
    expect(s.endpoints[0].path).toBe('/new-endpoint');
    expect(s.endpoints[1].path).toBe('/new-endpoint-2');
    expect(s.selectedId).toBe(s.endpoints[1].id);
  });

  it('pickMethod reuses an existing endpoint at the same path+method, otherwise creates one', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const firstId = useSpecStore.getState().endpoints[0].id;

    useSpecStore.getState().pickMethod('/users', 'GET');
    expect(useSpecStore.getState().endpoints).toHaveLength(1);
    expect(useSpecStore.getState().selectedId).toBe(firstId);

    useSpecStore.getState().pickMethod('/users', 'POST');
    expect(useSpecStore.getState().endpoints).toHaveLength(2);
    expect(useSpecStore.getState().selectedId).not.toBe(firstId);
  });

  it('deleteMethod removes the endpoint and reselects when the selected one is deleted', () => {
    useSpecStore.getState().pickMethod('/a', 'GET');
    useSpecStore.getState().pickMethod('/b', 'GET');
    const [first, second] = useSpecStore.getState().endpoints;

    useSpecStore.getState().selectBlock(first.id);
    useSpecStore.getState().deleteMethod(first.id);

    const s = useSpecStore.getState();
    expect(s.endpoints).toHaveLength(1);
    expect(s.selectedId).toBe(second.id);
  });

  it('deleteMethod leaves selection untouched when a different endpoint is deleted', () => {
    useSpecStore.getState().pickMethod('/a', 'GET');
    useSpecStore.getState().pickMethod('/b', 'GET');
    const [first, second] = useSpecStore.getState().endpoints;

    useSpecStore.getState().selectBlock(second.id);
    useSpecStore.getState().deleteMethod(first.id);

    expect(useSpecStore.getState().selectedId).toBe(second.id);
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
    const paramId = useSpecStore.getState().endpoints[0].params[0].id;
    useSpecStore.getState().setParam(id, paramId, { name: 'limit', in: 'query' });
    expect(useSpecStore.getState().endpoints[0].params[0]).toMatchObject({ name: 'limit', in: 'query' });

    useSpecStore.getState().removeParam(id, paramId);
    expect(useSpecStore.getState().endpoints[0].params).toHaveLength(0);
  });

  it('adds, updates, and removes headers', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;

    useSpecStore.getState().addHeader(id);
    const headerId = useSpecStore.getState().endpoints[0].headers[0].id;
    useSpecStore.getState().setHeader(id, headerId, { name: 'X-Request-Id' });
    expect(useSpecStore.getState().endpoints[0].headers[0].name).toBe('X-Request-Id');

    useSpecStore.getState().removeHeader(id, headerId);
    expect(useSpecStore.getState().endpoints[0].headers).toHaveLength(0);
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

  it('adds a response with the default code for a given status class', () => {
    useSpecStore.getState().pickMethod('/users', 'GET');
    const id = useSpecStore.getState().endpoints[0].id;

    useSpecStore.getState().addResponseForClass(id, '4xx');
    const responses = useSpecStore.getState().endpoints[0].responses;
    expect(responses[responses.length - 1].code).toBe('400');

    useSpecStore.getState().addResponseForClass(id, '5xx');
    const updated = useSpecStore.getState().endpoints[0].responses;
    expect(updated[updated.length - 1].code).toBe('500');
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

  it('adds a schema with a unique auto-generated name', () => {
    useSpecStore.getState().addSchema();
    useSpecStore.getState().addSchema();
    const s = useSpecStore.getState();
    expect(s.schemas.map((sc) => sc.name)).toEqual(['NewSchema', 'NewSchema2']);
    expect(s.selectedId).toBe(s.schemas[1].id);
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
