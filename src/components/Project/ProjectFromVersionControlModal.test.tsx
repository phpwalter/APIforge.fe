import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectFromVersionControlModal } from './ProjectFromVersionControlModal';
import { useAppStore } from '../../state/useAppStore';
import { getGithubContents, listGithubBranches, listGithubRepos } from '../../lib/api/repos';
import { importFromGithubFile } from '../../lib/importFromRepo';

vi.mock('../../lib/api/repos', () => ({
  listGithubRepos: vi.fn(),
  listGithubBranches: vi.fn(),
  getGithubContents: vi.fn(),
}));
vi.mock('../../lib/importFromRepo', () => ({
  importFromGithubFile: vi.fn(),
}));

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
  vi.clearAllMocks();
});

describe('ProjectFromVersionControlModal', () => {
  it('shows a connect-first message when GitHub is not linked', () => {
    useAppStore.setState({ authProvider: null });
    render(<ProjectFromVersionControlModal />);

    expect(screen.getByText(/Connect a GitHub account first/)).toBeInTheDocument();
    expect(listGithubRepos).not.toHaveBeenCalled();
  });

  it('is considered connected when GitHub is the primary sign-in provider', async () => {
    useAppStore.setState({ authProvider: 'github' });
    vi.mocked(listGithubRepos).mockReturnValue(new Promise(() => {}));
    render(<ProjectFromVersionControlModal />);

    await waitFor(() => expect(listGithubRepos).toHaveBeenCalled());
  });

  it('is considered connected when GitHub is linked (not primary)', async () => {
    useAppStore.getState().connectVersionControlProvider('github', { username: 'octocat' });
    vi.mocked(listGithubRepos).mockReturnValue(new Promise(() => {}));
    render(<ProjectFromVersionControlModal />);

    await waitFor(() => expect(listGithubRepos).toHaveBeenCalled());
  });

  it('shows an error message when loading repos fails', async () => {
    useAppStore.setState({ authProvider: 'github' });
    vi.mocked(listGithubRepos).mockRejectedValue(new Error('/repos/github responded 404 Not Found'));
    render(<ProjectFromVersionControlModal />);

    await waitFor(() => expect(screen.getByText('/repos/github responded 404 Not Found')).toBeInTheDocument());
  });

  it('walks repo → branch → file and imports the selected file, closing the modal', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ authProvider: 'github', projectFromVersionControlOpen: true });
    vi.mocked(listGithubRepos).mockResolvedValue([
      { id: 1, full_name: 'octocat/hello-world', private: false, default_branch: 'main', html_url: '' },
    ]);
    vi.mocked(listGithubBranches).mockResolvedValue([{ name: 'main', protected: true }]);
    vi.mocked(getGithubContents).mockImplementation((_owner, _repo, path) => {
      if (path === '') {
        return Promise.resolve([
          { name: 'openapi.yaml', path: 'openapi.yaml', type: 'file', sha: 'sha1' },
          { name: 'README.md', path: 'README.md', type: 'file', sha: 'sha2' },
        ]);
      }
      return Promise.resolve({
        name: 'openapi.yaml',
        path: 'openapi.yaml',
        sha: 'sha1',
        content: 'e30=',
        encoding: 'base64',
      });
    });

    render(<ProjectFromVersionControlModal />);

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    await user.selectOptions(screen.getByRole('combobox'), '1');

    await waitFor(() => expect(listGithubBranches).toHaveBeenCalledWith('octocat', 'hello-world'));
    await waitFor(() => expect(screen.getByRole('button', { name: /openapi\.yaml/ })).toBeInTheDocument());

    // Non-OpenAPI-looking files are present but not selectable.
    expect(screen.getByRole('button', { name: /README\.md/ })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /openapi\.yaml/ }));

    await waitFor(() => expect(importFromGithubFile).toHaveBeenCalled());
    await waitFor(() => expect(useAppStore.getState().projectFromVersionControlOpen).toBe(false));
  });
});
