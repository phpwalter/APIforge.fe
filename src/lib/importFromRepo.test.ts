import { importFromGithubFile } from './importFromRepo';
import { useAppStore } from './../state/useAppStore';
import { useSpecStore } from './../state/useSpecStore';
import type { GithubFileContent } from './api/repos';

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
});

const VALID_DOC = {
  openapi: '3.1.0',
  info: { title: 'Repo API', version: '1.0.0' },
  paths: { '/things': { get: { responses: { '200': { description: 'OK' } } } } },
};

function base64File(overrides: Partial<GithubFileContent> = {}): GithubFileContent {
  return {
    name: 'openapi.yaml',
    path: 'openapi.yaml',
    sha: 'abc123',
    content: btoa(JSON.stringify(VALID_DOC)),
    encoding: 'base64',
    ...overrides,
  };
}

describe('importFromGithubFile', () => {
  it('decodes base64 content, imports it, and names the project directly, no naming popup', () => {
    importFromGithubFile(base64File());

    const spec = useSpecStore.getState();
    expect(spec.hasDocument).toBe(true);
    expect(spec.endpoints).toHaveLength(1);

    const app = useAppStore.getState();
    expect(app.apiTitle).toBe('Repo API');
    expect(app.currentProjectName).toBe('Repo API');
    expect(app.projectNamePromptOpen).toBe(false);
  });

  it('sets an error import status and rethrows when the file content fails to parse', () => {
    expect(() => importFromGithubFile(base64File({ content: btoa('not an openapi doc') }))).toThrow();
    expect(useSpecStore.getState().importStatus?.type).toBe('error');
    expect(useSpecStore.getState().hasDocument).toBe(false);
  });
});
