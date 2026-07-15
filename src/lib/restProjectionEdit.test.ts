import { commitRestProjectionEdit } from './restProjectionEdit';
import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
});

const VALID_YAML = `openapi: 3.1.0
info:
  title: Edited API
  version: 2.0.0
paths:
  /widgets:
    get:
      summary: List widgets
      responses:
        '200':
          description: OK
`;

describe('commitRestProjectionEdit', () => {
  it('imports a valid edit into the spec store, updates project info, and clears manual overrides', () => {
    useAppStore.getState().setRestProjectionManual('yaml', VALID_YAML);
    useAppStore.getState().setRestProjectionManual('json', '{"stale": true}');

    commitRestProjectionEdit(VALID_YAML, 'yaml');

    const specState = useSpecStore.getState();
    expect(specState.endpoints).toHaveLength(1);
    expect(specState.endpoints[0]).toMatchObject({ path: '/widgets', method: 'GET', summary: 'List widgets' });

    const appState = useAppStore.getState();
    expect(appState.apiTitle).toBe('Edited API');
    expect(appState.apiVersion).toBe('2.0.0');
    expect(appState.apiOpenapiVersion).toBe('3.1.0');
    expect(appState.restProjectionManual).toEqual({ yaml: null, json: null, xml: null });
    expect(appState.restProjectionError).toBeNull();
  });

  it('leaves the manual edit in place and surfaces a friendly error for invalid input', () => {
    useAppStore.getState().setRestProjectionManual('yaml', 'not: [valid');

    commitRestProjectionEdit('not: [valid', 'yaml');

    const appState = useAppStore.getState();
    expect(appState.restProjectionManual.yaml).toBe('not: [valid');
    expect(appState.restProjectionError).toBeTruthy();
    expect(useSpecStore.getState().hasDocument).toBe(false);
  });

  it('surfaces a friendly error when the document has no paths', () => {
    commitRestProjectionEdit('openapi: 3.1.0\ninfo:\n  title: Empty\n  version: 1.0.0\n', 'yaml');

    expect(useAppStore.getState().restProjectionError).toMatch(/no paths/i);
  });
});
