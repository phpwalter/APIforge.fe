import { openServerWorkspaceIntoSettings } from './loadServerWorkspace';
import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { getServerWorkspace } from './api/workspaces';

vi.mock('./api/workspaces', () => ({
  getServerWorkspace: vi.fn(),
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

describe('openServerWorkspaceIntoSettings', () => {
  it('fetches the document, imports it, and drops straight into Workspace Settings', async () => {
    vi.mocked(getServerWorkspace).mockResolvedValue({
      id: 'ws-1',
      name: 'Saved API',
      updatedAt: '2026-07-18T00:00:00Z',
      specJson: VALID_SPEC_JSON,
    });

    await openServerWorkspaceIntoSettings('ws-1');

    const spec = useSpecStore.getState();
    expect(spec.hasDocument).toBe(true);
    expect(spec.endpoints).toHaveLength(1);

    const app = useAppStore.getState();
    expect(app.currentWorkspaceId).toBe('ws-1');
    expect(app.currentWorkspaceName).toBe('Saved API');
    expect(app.isNewWorkspace).toBe(false);
    expect(app.workspaceSettingsOpen).toBe(true);
  });

  it('sets an error import status when the fetch fails, without crashing', async () => {
    vi.mocked(getServerWorkspace).mockRejectedValue(new Error('/workspaces/ws-1 responded 404 Not Found'));

    await openServerWorkspaceIntoSettings('ws-1');

    expect(useSpecStore.getState().importStatus).toEqual({
      type: 'error',
      message: '/workspaces/ws-1 responded 404 Not Found',
    });
    expect(useSpecStore.getState().hasDocument).toBe(false);
    expect(useAppStore.getState().workspaceSettingsOpen).toBe(false);
  });

  it('sets an error import status when the fetched specJson fails to parse', async () => {
    vi.mocked(getServerWorkspace).mockResolvedValue({
      id: 'ws-1',
      name: 'Broken',
      updatedAt: '2026-07-18T00:00:00Z',
      specJson: 'not json',
    });

    await openServerWorkspaceIntoSettings('ws-1');

    expect(useSpecStore.getState().importStatus?.type).toBe('error');
    expect(useSpecStore.getState().hasDocument).toBe(false);
  });
});
