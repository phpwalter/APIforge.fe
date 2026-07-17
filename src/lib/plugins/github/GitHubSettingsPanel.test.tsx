import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GitHubSettingsPanel } from './GitHubSettingsPanel';
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

describe('GitHubSettingsPanel', () => {
  it('starts disconnected with a real "Connect with GitHub" button that redirects via OAuth', async () => {
    const user = userEvent.setup();
    render(<GitHubSettingsPanel />);

    expect(screen.queryByText(/Connected/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Connect with GitHub' }));

    expect(redirectToProviderLink).toHaveBeenCalledWith('github');
  });

  it('shows GitHub as connected with the linked username, plus a working Disconnect button', async () => {
    const user = userEvent.setup();
    useAppStore.getState().connectVersionControlProvider('github', { username: 'octocat' });
    render(<GitHubSettingsPanel />);

    expect(screen.getByText('Connected as octocat')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect with GitHub' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(useAppStore.getState().versionControlLinks.github).toBeUndefined();
    expect(screen.queryByText(/Connected/)).not.toBeInTheDocument();
  });

  it('treats GitHub as connected (no Disconnect button) when it is the primary sign-in provider', () => {
    useAppStore.setState({ authProvider: 'github' });
    render(<GitHubSettingsPanel />);

    expect(screen.getByText('Connected · Primary sign-in')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Disconnect' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect with GitHub' })).not.toBeInTheDocument();
  });
});
