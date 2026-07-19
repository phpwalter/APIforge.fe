import { getGithubContents, listGithubBranches, listGithubRepos } from './repos';
import { apiGet } from './client';

vi.mock('./client', () => ({
  apiGet: vi.fn(),
  apiUrl: vi.fn((path: string) => `http://api.test${path}`),
}));

describe('repos API wrappers', () => {
  it('listGithubRepos calls GET /repos/github', () => {
    listGithubRepos();
    expect(apiGet).toHaveBeenCalledWith('/repos/github');
  });

  it('listGithubBranches calls GET /repos/github/{owner}/{repo}/branches', () => {
    listGithubBranches('octocat', 'hello-world');
    expect(apiGet).toHaveBeenCalledWith('/repos/github/octocat/hello-world/branches');
  });

  it('getGithubContents calls GET /repos/github/{owner}/{repo}/contents with path and ref as query params', () => {
    getGithubContents('octocat', 'hello-world', 'docs/openapi.yaml', 'main');
    expect(apiGet).toHaveBeenCalledWith(
      '/repos/github/octocat/hello-world/contents?path=docs%2Fopenapi.yaml&ref=main',
    );
  });
});
