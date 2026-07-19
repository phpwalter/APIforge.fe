import { initWorkspaceAutosave, saveNow, scheduleSave } from './workspaceAutosave';
import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { getWorkspace } from './workspaces';
import type { Endpoint } from '../types/spec';

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('saveNow', () => {
  it('does nothing when no workspace has been named yet', () => {
    useSpecStore.getState().loadSampleProject();
    saveNow();
    expect(useAppStore.getState().saveState).toBe('saved'); // unchanged from the default
  });

  it('does nothing when there is no document loaded, even with a named workspace', () => {
    useAppStore.setState({ currentWorkspaceId: 'ws-1', currentWorkspaceName: 'My API' });
    saveNow();
    expect(getWorkspace('ws-1')).toBeUndefined();
  });

  it('saves a real OpenAPI document to the workspace entry and marks the badge saved', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentWorkspaceId: 'ws-1', currentWorkspaceName: 'My API', apiTitle: 'My API' });

    saveNow();

    const entry = getWorkspace('ws-1');
    expect(entry).toBeDefined();
    expect(entry?.name).toBe('My API');
    const doc = JSON.parse(entry!.specJson);
    expect(doc.info.title).toBe('My API');
    expect(doc.paths).toBeDefined();
    expect(useAppStore.getState().saveState).toBe('saved');
    expect(useAppStore.getState().lastSavedAt).not.toBeNull();
  });
});

describe('scheduleSave', () => {
  it('does nothing when there is no active workspace', () => {
    scheduleSave();
    vi.advanceTimersByTime(5000);
    expect(useAppStore.getState().saveState).toBe('saved');
  });

  it('marks the badge unsaved immediately, then saves after the debounce settles', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentWorkspaceId: 'ws-1', currentWorkspaceName: 'My API' });

    scheduleSave();
    expect(useAppStore.getState().saveState).toBe('unsaved');
    expect(getWorkspace('ws-1')).toBeUndefined();

    vi.advanceTimersByTime(1000);

    expect(useAppStore.getState().saveState).toBe('saved');
    expect(getWorkspace('ws-1')).toBeDefined();
  });

  it('rapid successive calls only save once, after the last one settles', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentWorkspaceId: 'ws-1', currentWorkspaceName: 'My API' });

    scheduleSave();
    vi.advanceTimersByTime(500);
    scheduleSave();
    vi.advanceTimersByTime(500);
    expect(getWorkspace('ws-1')).toBeUndefined(); // still within the debounce window from the 2nd call

    vi.advanceTimersByTime(500);
    expect(getWorkspace('ws-1')).toBeDefined();
  });
});

describe('initWorkspaceAutosave', () => {
  it('autosaves when the document changes after a workspace has been named', () => {
    initWorkspaceAutosave();
    useAppStore.setState({ currentWorkspaceId: 'ws-1', currentWorkspaceName: 'My API' });

    const endpoint: Endpoint = {
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
    };
    useSpecStore.setState({ hasDocument: true, endpoints: [endpoint] });

    vi.advanceTimersByTime(1000);

    const entry = getWorkspace('ws-1');
    expect(entry).toBeDefined();
    expect(JSON.parse(entry!.specJson).paths['/things']).toBeDefined();
  });

  it('saves immediately (not debounced) the moment a workspace name is first confirmed', () => {
    initWorkspaceAutosave();
    useSpecStore.getState().loadSampleProject();

    useAppStore.getState().startWorkspace('Untitled API');
    useAppStore.getState().confirmWorkspaceName('My API');

    // No vi.advanceTimersByTime — this should already be saved synchronously.
    const id = useAppStore.getState().currentWorkspaceId!;
    expect(getWorkspace(id)).toBeDefined();
  });
});
