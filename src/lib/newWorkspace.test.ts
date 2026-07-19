import { createNewWorkspace } from './newWorkspace';
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
});
