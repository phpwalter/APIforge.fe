import { createNewProject, requestNewProject } from './newProject';
import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
});

describe('createNewProject', () => {
  it('opens a blank, ready-to-edit document', () => {
    createNewProject();
    const s = useSpecStore.getState();
    expect(s.hasDocument).toBe(true);
    expect(s.endpoints).toEqual([]);
    expect(s.schemas).toEqual([]);
  });

  it('resets project info to defaults', () => {
    useAppStore.setState({ apiTitle: 'Old API', apiVersion: '9.9.9' });
    createNewProject();
    expect(useAppStore.getState().apiTitle).toBe('Untitled API');
    expect(useAppStore.getState().apiVersion).toBe('1.0.0');
  });

  it('starts a new project and opens the naming prompt', () => {
    createNewProject();
    const s = useAppStore.getState();
    expect(s.currentProjectId).not.toBeNull();
    expect(s.projectNamePromptOpen).toBe(true);
    expect(s.projectNamePromptDefault).toBe('Untitled API');
  });

  it('marks the project as new (never saved to the server)', () => {
    createNewProject();
    expect(useAppStore.getState().isNewProject).toBe(true);
  });
});

describe('requestNewProject', () => {
  it('creates the new project directly when nothing is currently loaded', () => {
    requestNewProject();

    expect(useSpecStore.getState().hasDocument).toBe(true);
    expect(useAppStore.getState().unsavedChangesPromptOpen).toBe(false);
  });

  it('opens the unsaved-changes prompt instead of wiping when there is real savable content', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentProjectName: 'My API' });

    requestNewProject();

    expect(useAppStore.getState().unsavedChangesPromptOpen).toBe(true);
    // The existing document must not have been touched yet — only confirming the prompt wipes it.
    expect(useSpecStore.getState().endpoints.length).toBeGreaterThan(0);
  });

  it('creates the new project directly, skipping the prompt, when the current one has no savable content', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentProjectName: 'Untitled API' });

    requestNewProject();

    expect(useAppStore.getState().unsavedChangesPromptOpen).toBe(false);
    expect(useSpecStore.getState().endpoints).toEqual([]);
  });
});
