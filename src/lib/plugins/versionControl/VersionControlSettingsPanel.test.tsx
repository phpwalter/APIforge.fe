import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VersionControlSettingsPanel } from './VersionControlSettingsPanel';
import { useAppStore } from '../../../state/useAppStore';
import { redirectToProviderLink } from '../../api/auth';

vi.mock('../../api/auth', () => ({
  signOutProvider: vi.fn(() => Promise.resolve()),
  unlinkProvider: vi.fn(() => Promise.resolve()),
  redirectToProviderLink: vi.fn(),
}));

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
  vi.clearAllMocks();
});

describe('VersionControlSettingsPanel', () => {
  it('lists all three providers, with GitLab and Bitbucket marked as Coming Soon', () => {
    render(<VersionControlSettingsPanel />);

    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('GitLab')).toBeInTheDocument();
    expect(screen.getByText('Bitbucket')).toBeInTheDocument();
    expect(screen.getAllByText('Coming Soon')).toHaveLength(2);
  });

  it('GitHub starts disconnected with a real "Connect with GitHub" button that redirects via OAuth', async () => {
    const user = userEvent.setup();
    render(<VersionControlSettingsPanel />);

    expect(screen.queryByText(/Connected/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Connect with GitHub' }));

    expect(redirectToProviderLink).toHaveBeenCalledWith('github');
  });

  it('GitLab and Bitbucket "Connect" buttons are disabled stubs — no OAuth redirect wired up', async () => {
    const user = userEvent.setup();
    render(<VersionControlSettingsPanel />);

    const gitlabBtn = screen.getByRole('button', { name: 'Connect with GitLab' });
    const bitbucketBtn = screen.getByRole('button', { name: 'Connect with Bitbucket' });
    expect(gitlabBtn).toBeDisabled();
    expect(bitbucketBtn).toBeDisabled();

    await user.click(gitlabBtn);
    await user.click(bitbucketBtn);
    expect(redirectToProviderLink).not.toHaveBeenCalled();
  });

  it('shows GitHub as connected with the linked username, plus a working Disconnect button', async () => {
    const user = userEvent.setup();
    useAppStore.getState().connectVersionControlProvider('github', { username: 'octocat' });
    render(<VersionControlSettingsPanel />);

    expect(screen.getByText('Connected as octocat')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect with GitHub' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(useAppStore.getState().versionControlLinks.github).toBeUndefined();
    expect(screen.queryByText(/Connected/)).not.toBeInTheDocument();
  });

  it('treats GitHub as connected (no Disconnect button) when it is the primary sign-in provider', () => {
    useAppStore.setState({ authProvider: 'github' });
    render(<VersionControlSettingsPanel />);

    expect(screen.getByText('Connected · Primary sign-in')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Disconnect' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect with GitHub' })).not.toBeInTheDocument();
  });
});
