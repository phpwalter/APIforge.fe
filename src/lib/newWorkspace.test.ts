import { createNewWorkspace, requestNewWorkspace } from './newWorkspace';
import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
});

describe('createNewWorkspace', () => {
  it('opens a blank, ready-to-edit document', () => {
    createNewWorkspace();
    const s = useSpecStore.getState();
    expect(s.hasDocument).toBe(true);
    expect(s.endpoints).toEqual([]);
    expect(s.schemas).toEqual([]);
  });

  it('resets project info to defaults', () => {
    useAppStore.setState({ apiTitle: 'Old API', apiVersion: '9.9.9' });
    createNewWorkspace();
    expect(useAppStore.getState().apiTitle).toBe('Untitled API');
    expect(useAppStore.getState().apiVersion).toBe('1.0.0');
  });

  it('starts a new workspace and opens the naming prompt', () => {
    createNewWorkspace();
    const s = useAppStore.getState();
    expect(s.currentWorkspaceId).not.toBeNull();
    expect(s.workspaceNamePromptOpen).toBe(true);
    expect(s.workspaceNamePromptDefault).toBe('Untitled API');
  });

  it('marks the workspace as new (never saved to the server)', () => {
    createNewWorkspace();
    expect(useAppStore.getState().isNewWorkspace).toBe(true);
  });
});

describe('requestNewWorkspace', () => {
  it('creates the new workspace directly when nothing is currently loaded', () => {
    requestNewWorkspace();

    expect(useSpecStore.getState().hasDocument).toBe(true);
    expect(useAppStore.getState().unsavedChangesPromptOpen).toBe(false);
  });

  it('opens the unsaved-changes prompt instead of wiping when there is real savable content', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentWorkspaceName: 'My API' });

    requestNewWorkspace();

    expect(useAppStore.getState().unsavedChangesPromptOpen).toBe(true);
    // The existing document must not have been touched yet — only confirming the prompt wipes it.
    expect(useSpecStore.getState().endpoints.length).toBeGreaterThan(0);
  });

  it('creates the new workspace directly, skipping the prompt, when the current one has no savable content', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentWorkspaceName: 'Untitled API' });

    requestNewWorkspace();

    expect(useAppStore.getState().unsavedChangesPromptOpen).toBe(false);
    expect(useSpecStore.getState().endpoints).toEqual([]);
  });
});
