import { initProjectAutosave, saveNow, scheduleSave } from './projectAutosave';
import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { getProject } from './projects';
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
  it('does nothing when no project has been named yet', () => {
    useSpecStore.getState().loadSampleProject();
    saveNow();
    expect(useAppStore.getState().saveState).toBe('saved'); // unchanged from the default
  });

  it('does nothing when there is no document loaded, even with a named project', () => {
    useAppStore.setState({ currentProjectId: 'ws-1', currentProjectName: 'My API' });
    saveNow();
    expect(getProject('ws-1')).toBeUndefined();
  });

  it('saves a real OpenAPI document to the project entry and marks the badge saved', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentProjectId: 'ws-1', currentProjectName: 'My API', apiTitle: 'My API' });

    saveNow();

    const entry = getProject('ws-1');
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
  it('does nothing when there is no active project', () => {
    scheduleSave();
    vi.advanceTimersByTime(5000);
    expect(useAppStore.getState().saveState).toBe('saved');
  });

  it('marks the badge unsaved immediately, then saves after the debounce settles', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentProjectId: 'ws-1', currentProjectName: 'My API' });

    scheduleSave();
    expect(useAppStore.getState().saveState).toBe('unsaved');
    expect(getProject('ws-1')).toBeUndefined();

    vi.advanceTimersByTime(1000);

    expect(useAppStore.getState().saveState).toBe('saved');
    expect(getProject('ws-1')).toBeDefined();
  });

  it('rapid successive calls only save once, after the last one settles', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentProjectId: 'ws-1', currentProjectName: 'My API' });

    scheduleSave();
    vi.advanceTimersByTime(500);
    scheduleSave();
    vi.advanceTimersByTime(500);
    expect(getProject('ws-1')).toBeUndefined(); // still within the debounce window from the 2nd call

    vi.advanceTimersByTime(500);
    expect(getProject('ws-1')).toBeDefined();
  });
});

describe('initProjectAutosave', () => {
  it('autosaves when the document changes after a project has been named', () => {
    initProjectAutosave();
    useAppStore.setState({ currentProjectId: 'ws-1', currentProjectName: 'My API' });

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

    const entry = getProject('ws-1');
    expect(entry).toBeDefined();
    expect(JSON.parse(entry!.specJson).paths['/things']).toBeDefined();
  });

  it('saves immediately (not debounced) the moment a project name is first confirmed', () => {
    initProjectAutosave();
    useSpecStore.getState().loadSampleProject();

    useAppStore.getState().startProject('Untitled API');
    useAppStore.getState().confirmProjectName('My API');

    // No vi.advanceTimersByTime — this should already be saved synchronously.
    const id = useAppStore.getState().currentProjectId!;
    expect(getProject(id)).toBeDefined();
  });

  it('autosaves (debounced) when an already-named project is renamed, not just on the first name', () => {
    initProjectAutosave();
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentProjectId: 'ws-1', currentProjectName: 'My API' });
    saveNow();
    localStorage.clear(); // discard that save so the assertion below proves the rename re-saved it

    useAppStore.getState().setProjectName('My Renamed API');
    vi.advanceTimersByTime(1000);

    const entry = getProject('ws-1');
    expect(entry).toBeDefined();
    expect(entry?.name).toBe('My Renamed API');
  });
});
