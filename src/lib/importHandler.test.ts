import { importOpenApiFile, importOpenApiFileIntoSettings } from './importHandler';
import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
});

function fileFor(json: unknown, name = 'spec.json'): File {
  return new File([JSON.stringify(json)], name, { type: 'application/json' });
}

const VALID_DOC = {
  openapi: '3.1.0',
  info: { title: 'Imported API', version: '1.2.3' },
  paths: { '/things': { get: { responses: { '200': { description: 'OK' } } } } },
};

describe('importOpenApiFile', () => {
  it('imports the parsed spec into the spec store and project info', async () => {
    await importOpenApiFile(fileFor(VALID_DOC));

    const spec = useSpecStore.getState();
    expect(spec.hasDocument).toBe(true);
    expect(spec.endpoints).toHaveLength(1);
    expect(useAppStore.getState().apiTitle).toBe('Imported API');
    expect(useAppStore.getState().apiVersion).toBe('1.2.3');
  });

  it('starts a new named workspace, defaulting the name to the document title', async () => {
    await importOpenApiFile(fileFor(VALID_DOC));

    const app = useAppStore.getState();
    expect(app.currentWorkspaceId).not.toBeNull();
    expect(app.workspaceNamePromptOpen).toBe(true);
    expect(app.workspaceNamePromptDefault).toBe('Imported API');
  });

  it('sets an error import status and does not start a workspace when the file fails to parse', async () => {
    await importOpenApiFile(fileFor({ not: 'an openapi doc' }));

    expect(useSpecStore.getState().importStatus?.type).toBe('error');
    expect(useSpecStore.getState().hasDocument).toBe(false);
    expect(useAppStore.getState().currentWorkspaceId).toBeNull();
  });
});

describe('importOpenApiFileIntoSettings', () => {
  it('imports the file and drops straight into Workspace Settings, skipping the naming popup', async () => {
    await importOpenApiFileIntoSettings(fileFor(VALID_DOC));

    const app = useAppStore.getState();
    expect(useSpecStore.getState().hasDocument).toBe(true);
    expect(app.currentWorkspaceId).not.toBeNull();
    expect(app.currentWorkspaceName).toBe('Imported API');
    expect(app.workspaceNamePromptOpen).toBe(false);
    expect(app.workspaceSettingsOpen).toBe(true);
    expect(app.isNewWorkspace).toBe(true);
  });

  it('sets an error import status and does not start a workspace when the file fails to parse', async () => {
    await importOpenApiFileIntoSettings(fileFor({ not: 'an openapi doc' }));

    expect(useSpecStore.getState().importStatus?.type).toBe('error');
    expect(useAppStore.getState().currentWorkspaceId).toBeNull();
    expect(useAppStore.getState().workspaceSettingsOpen).toBe(false);
  });
});
