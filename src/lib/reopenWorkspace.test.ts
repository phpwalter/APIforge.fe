import { openRecentWorkspace } from './reopenWorkspace';
import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { saveWorkspace } from './workspaces';

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
  localStorage.clear();
});

const VALID_SPEC_JSON = JSON.stringify({
  openapi: '3.1.0',
  info: { title: 'Saved API', version: '2.0.0' },
  paths: {
    '/things': { get: { responses: { '200': { description: 'OK' } } } },
  },
});

describe('openRecentWorkspace', () => {
  it('does nothing when the workspace id is unknown', () => {
    openRecentWorkspace('missing');
    expect(useSpecStore.getState().hasDocument).toBe(false);
  });

  it('reimports the saved document and sets the workspace identity directly, without a naming prompt', () => {
    saveWorkspace({ id: 'ws-1', name: 'Saved API', savedAt: 1000, specJson: VALID_SPEC_JSON });

    openRecentWorkspace('ws-1');

    const spec = useSpecStore.getState();
    expect(spec.hasDocument).toBe(true);
    expect(spec.endpoints).toHaveLength(1);
    expect(spec.endpoints[0].path).toBe('/things');

    const app = useAppStore.getState();
    expect(app.apiTitle).toBe('Saved API');
    expect(app.apiVersion).toBe('2.0.0');
    expect(app.currentWorkspaceId).toBe('ws-1');
    expect(app.currentWorkspaceName).toBe('Saved API');
    expect(app.workspaceNamePromptOpen).toBe(false);
  });

  it('sets an error import status when the saved specJson is corrupted, without crashing', () => {
    saveWorkspace({ id: 'ws-1', name: 'Broken', savedAt: 1000, specJson: 'not json' });

    openRecentWorkspace('ws-1');

    expect(useSpecStore.getState().importStatus?.type).toBe('error');
    expect(useSpecStore.getState().hasDocument).toBe(false);
  });
});
