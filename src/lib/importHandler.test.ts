import { importOpenApiFile } from './importHandler';
import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
  vi.stubEnv('VITE_API_SERVER', 'http://api.test');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function fileFor(json: unknown, name = 'spec.json'): File {
  return new File([JSON.stringify(json)], name, { type: 'application/json' });
}

const VALID_DOC = {
  openapi: '3.1.0',
  info: { title: 'Imported API', version: '1.2.3' },
  paths: { '/things': { get: { responses: { '200': { description: 'OK' } } } } },
};

function policyResponse(data: unknown[]) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({
      data,
      meta: { count: data.length, http_method: 'GET', company_id: null, project_id: null, plan_code: null },
    }),
    text: () => Promise.resolve(''),
    headers: new Headers(),
  } as Response;
}

describe('importOpenApiFile', () => {
  it('imports the parsed spec into the spec store and project info', async () => {
    await importOpenApiFile(fileFor(VALID_DOC));

    const spec = useSpecStore.getState();
    expect(spec.hasDocument).toBe(true);
    expect(spec.endpoints).toHaveLength(1);
    expect(useAppStore.getState().apiTitle).toBe('Imported API');
    expect(useAppStore.getState().apiVersion).toBe('1.2.3');
  });

  it('starts a new project named directly from the document title, no naming popup', async () => {
    await importOpenApiFile(fileFor(VALID_DOC));

    const app = useAppStore.getState();
    expect(app.currentProjectId).not.toBeNull();
    expect(app.currentProjectName).toBe('Imported API');
    expect(app.projectNamePromptOpen).toBe(false);
    expect(app.isNewProject).toBe(true);
  });

  it('preserves the imported responses by default without loading Method Settings', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const source = {
      ...VALID_DOC,
      paths: {
        '/things': {
          get: {
            responses: {
              '200': { description: 'Imported success' },
              '418': { description: 'Custom response' },
            },
          },
        },
      },
    };

    await expect(importOpenApiFile(fileFor(source), 'preserve')).resolves.toBe(true);

    const responses = useSpecStore.getState().endpoints[0]?.responses ?? [];
    expect(responses.map((response) => response.code)).toEqual(['200', '418']);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('adds only missing enabled Required or Default responses when Method Settings are applied', async () => {
    const fetchMock = vi.fn().mockResolvedValue(policyResponse([
      {
        http_method: 'GET',
        status_code: 200,
        title: 'OK',
        description: 'Success',
        response_class: 2,
        is_enabled: true,
        is_required: false,
        is_default: true,
        display_order: 10,
        effective_source: 'system',
        project_overrides_allowed: false,
        project_plan_eligible: false,
      },
      {
        http_method: 'GET',
        status_code: 404,
        title: 'Not Found',
        description: 'Resource not found',
        response_class: 4,
        is_enabled: true,
        is_required: true,
        is_default: false,
        display_order: 20,
        effective_source: 'system',
        project_overrides_allowed: false,
        project_plan_eligible: false,
      },
      {
        http_method: 'GET',
        status_code: 500,
        title: 'Internal Server Error',
        description: 'Server error',
        response_class: 5,
        is_enabled: false,
        is_required: true,
        is_default: true,
        display_order: 30,
        effective_source: 'system',
        project_overrides_allowed: false,
        project_plan_eligible: false,
      },
    ]));
    vi.stubGlobal('fetch', fetchMock);

    const source = {
      ...VALID_DOC,
      paths: {
        '/things': {
          get: {
            responses: {
              '200': { description: 'Imported success' },
              '418': { description: 'Custom response' },
            },
          },
        },
      },
    };

    await expect(importOpenApiFile(fileFor(source), 'apply-method-policies')).resolves.toBe(true);

    const responses = useSpecStore.getState().endpoints[0]?.responses ?? [];
    expect(responses.map((response) => response.code)).toEqual(['200', '418', '404']);
    expect(responses.find((response) => response.code === '200')?.description).toBe('Imported success');
    expect(responses.find((response) => response.code === '418')?.description).toBe('Custom response');
    expect(responses.find((response) => response.code === '404')?.description).toBe('Not Found');
    expect(responses.some((response) => response.code === '500')).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sets an error import status and does not start a project when the file fails to parse', async () => {
    await importOpenApiFile(fileFor({ not: 'an openapi doc' }));

    expect(useSpecStore.getState().importStatus?.type).toBe('error');
    expect(useSpecStore.getState().hasDocument).toBe(false);
    expect(useAppStore.getState().currentProjectId).toBeNull();
  });
});
