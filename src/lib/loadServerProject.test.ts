import { openServerProjectIntoSettings } from './loadServerProject';
import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { getServerProject } from './api/projects';

vi.mock('./api/projects', () => ({
  getServerProject: vi.fn(),
}));

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
  vi.clearAllMocks();
});

const VALID_SPEC_JSON = JSON.stringify({
  openapi: '3.1.0',
  info: { title: 'Saved API', version: '2.0.0' },
  paths: { '/things': { get: { responses: { '200': { description: 'OK' } } } } },
});

describe('openServerProjectIntoSettings', () => {
  it('fetches the document, imports it, and drops straight into Project Settings', async () => {
    vi.mocked(getServerProject).mockResolvedValue({
      id: 'ws-1',
      name: 'Saved API',
      updatedAt: '2026-07-18T00:00:00Z',
      specJson: VALID_SPEC_JSON,
    });

    await openServerProjectIntoSettings('ws-1');

    const spec = useSpecStore.getState();
    expect(spec.hasDocument).toBe(true);
    expect(spec.endpoints).toHaveLength(1);

    const app = useAppStore.getState();
    expect(app.currentProjectId).toBe('ws-1');
    expect(app.currentProjectName).toBe('Saved API');
    expect(app.isNewProject).toBe(false);
    expect(app.projectSettingsOpen).toBe(true);
  });

  it('sets an error import status when the fetch fails, without crashing', async () => {
    vi.mocked(getServerProject).mockRejectedValue(new Error('/projects/ws-1 responded 404 Not Found'));

    await openServerProjectIntoSettings('ws-1');

    expect(useSpecStore.getState().importStatus).toEqual({
      type: 'error',
      message: '/projects/ws-1 responded 404 Not Found',
    });
    expect(useSpecStore.getState().hasDocument).toBe(false);
    expect(useAppStore.getState().projectSettingsOpen).toBe(false);
  });

  it('sets an error import status when the fetched specJson fails to parse', async () => {
    vi.mocked(getServerProject).mockResolvedValue({
      id: 'ws-1',
      name: 'Broken',
      updatedAt: '2026-07-18T00:00:00Z',
      specJson: 'not json',
    });

    await openServerProjectIntoSettings('ws-1');

    expect(useSpecStore.getState().importStatus?.type).toBe('error');
    expect(useSpecStore.getState().hasDocument).toBe(false);
  });
});
