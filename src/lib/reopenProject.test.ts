import { openRecentProject } from './reopenProject';
import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { saveProject } from './projects';

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

describe('openRecentProject', () => {
  it('does nothing when the project id is unknown', () => {
    openRecentProject('missing');
    expect(useSpecStore.getState().hasDocument).toBe(false);
  });

  it('reimports the saved document and sets the project identity directly, without a naming prompt', () => {
    saveProject({ id: 'ws-1', name: 'Saved API', savedAt: 1000, specJson: VALID_SPEC_JSON });

    openRecentProject('ws-1');

    const spec = useSpecStore.getState();
    expect(spec.hasDocument).toBe(true);
    expect(spec.endpoints).toHaveLength(1);
    expect(spec.endpoints[0].path).toBe('/things');

    const app = useAppStore.getState();
    expect(app.apiTitle).toBe('Saved API');
    expect(app.apiVersion).toBe('2.0.0');
    expect(app.currentProjectId).toBe('ws-1');
    expect(app.currentProjectName).toBe('Saved API');
    expect(app.projectNamePromptOpen).toBe(false);
  });

  it('sets an error import status when the saved specJson is corrupted, without crashing', () => {
    saveProject({ id: 'ws-1', name: 'Broken', savedAt: 1000, specJson: 'not json' });

    openRecentProject('ws-1');

    expect(useSpecStore.getState().importStatus?.type).toBe('error');
    expect(useSpecStore.getState().hasDocument).toBe(false);
  });
});
