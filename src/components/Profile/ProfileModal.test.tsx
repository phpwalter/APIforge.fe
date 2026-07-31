import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileModal } from './ProfileModal';
import { useAppStore } from '../../state/useAppStore';
import { redirectToProviderLink, updateMe } from '../../lib/api/auth';
import { setAuthToken } from '../../lib/api/authToken';

vi.mock('../../lib/api/auth', () => ({
  updateMe: vi.fn(),
  signOutProvider: vi.fn(() => Promise.resolve()),
  unlinkProvider: vi.fn(() => Promise.resolve()),
  redirectToProviderLink: vi.fn(),
}));

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
  vi.clearAllMocks();
  localStorage.clear();
});

describe('ProfileModal', () => {
  it('pre-fills the editable fields and shows the read-only identity info', () => {
    useAppStore.setState({
      userProfile: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        bio: 'Mathematician',
        memberSince: '2026-01-15T00:00:00Z',
      },
      authProvider: 'github',
    });
    render(<ProfileModal />);

    expect(screen.getByPlaceholderText('Your name')).toHaveValue('Ada Lovelace');
    expect(screen.getByPlaceholderText('A little about you…')).toHaveValue('Mathematician');
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText('Signed in with GitHub')).toBeInTheDocument();
    expect(screen.getByText(/Member since/)).toBeInTheDocument();
  });

  it('does not render a Username field', () => {
    useAppStore.setState({ userProfile: { name: 'Ada Lovelace', email: 'ada@example.com' } });
    render(<ProfileModal />);

    expect(screen.queryByText('Username')).not.toBeInTheDocument();
  });

  it('with no real session (demo sign-in), Save updates the store locally without calling the backend', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      userProfile: { name: 'Demo User', email: 'demo@example.com' },
      authProvider: null,
      profileOpen: true,
    });
    render(<ProfileModal />);

    await user.clear(screen.getByPlaceholderText('Your name'));
    await user.type(screen.getByPlaceholderText('Your name'), 'New Name');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(updateMe).not.toHaveBeenCalled();
    expect(useAppStore.getState().userProfile.name).toBe('New Name');
    expect(useAppStore.getState().profileOpen).toBe(false);
  });

  it('with a real session, Save calls updateMe (without a username field) and applies the response to the store', async () => {
    const user = userEvent.setup();
    setAuthToken('the-token');
    useAppStore.setState({
      userProfile: { name: 'Ada', email: 'ada@example.com', recordVersion: 4 },
      authProvider: 'github',
      profileOpen: true,
    });
    vi.mocked(updateMe).mockResolvedValue({ display_name: 'Ada Lovelace', bio: 'Mathematician', record_version: 5 });

    render(<ProfileModal />);
    await user.clear(screen.getByPlaceholderText('Your name'));
    await user.type(screen.getByPlaceholderText('Your name'), 'Ada Lovelace');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(useAppStore.getState().profileOpen).toBe(false));
    expect(updateMe).toHaveBeenCalledWith({
      record_version: 4,
      display_name: 'Ada Lovelace',
      bio: undefined,
      use_gravatar: false,
      gravatar_email: undefined,
    });
    expect(useAppStore.getState().userProfile).toMatchObject({ name: 'Ada Lovelace', bio: 'Mathematician', recordVersion: 5 });
  });

  it('does not send PATCH when the authenticated profile has no record version', async () => {
    const user = userEvent.setup();
    setAuthToken('the-token');
    useAppStore.setState({
      userProfile: { name: 'Ada', email: 'ada@example.com' },
      authProvider: 'github',
      profileOpen: true,
    });

    render(<ProfileModal />);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(/profile version is unavailable/i)).toBeInTheDocument();
    expect(updateMe).not.toHaveBeenCalled();
    expect(useAppStore.getState().profileOpen).toBe(true);
  });

  it('shows an inline error and keeps the dialog open when the save fails', async () => {
    const user = userEvent.setup();
    setAuthToken('the-token');
    useAppStore.setState({
      userProfile: { name: 'Ada', email: 'ada@example.com', recordVersion: 2 },
      authProvider: 'github',
      profileOpen: true,
    });
    vi.mocked(updateMe).mockRejectedValue(new Error('/auth/me responded 400 Bad Request'));

    render(<ProfileModal />);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByText('/auth/me responded 400 Bad Request')).toBeInTheDocument());
    expect(useAppStore.getState().profileOpen).toBe(true);
  });

  it('Cancel closes the dialog without saving', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ userProfile: { name: 'Ada', email: 'ada@example.com' }, profileOpen: true });
    render(<ProfileModal />);

    await user.clear(screen.getByPlaceholderText('Your name'));
    await user.type(screen.getByPlaceholderText('Your name'), 'Someone Else');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(updateMe).not.toHaveBeenCalled();
    expect(useAppStore.getState().userProfile.name).toBe('Ada');
    expect(useAppStore.getState().profileOpen).toBe(false);
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ userProfile: { name: 'Ada', email: 'ada@example.com' }, profileOpen: true });
    render(<ProfileModal />);

    await user.keyboard('{Escape}');

    expect(useAppStore.getState().profileOpen).toBe(false);
  });
});

describe('ProfileModal — Linked Profiles', () => {
  it('lists GitHub, GitLab, and Bitbucket rows via the same panels Settings :: Plugins uses', () => {
    useAppStore.setState({ userProfile: { name: 'Ada', email: 'ada@example.com' }, authProvider: null });
    render(<ProfileModal />);

    expect(screen.getByRole('button', { name: 'Connect with GitHub' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect with GitLab' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect with Bitbucket' })).toBeInTheDocument();
  });

  it("shows GitHub's own row as Primary, with no separate generic Primary row", () => {
    useAppStore.setState({ userProfile: { name: 'Ada', email: 'ada@example.com' }, authProvider: 'github' });
    render(<ProfileModal />);

    expect(screen.getByText('Connected · Primary sign-in')).toBeInTheDocument();
    // No standalone "Primary" badge — that's only rendered by the generic fallback row.
    expect(screen.queryByText('Primary', { exact: true })).not.toBeInTheDocument();
  });

  it('shows a generic Primary row for a sign-in provider with no dedicated row (e.g. Google)', () => {
    useAppStore.setState({ userProfile: { name: 'Ada', email: 'ada@example.com' }, authProvider: 'google' });
    render(<ProfileModal />);

    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('shows an explanatory note instead of a Primary row for a demo sign-in', () => {
    useAppStore.setState({ userProfile: { name: 'Ada', email: 'ada@example.com' }, authProvider: null });
    render(<ProfileModal />);

    expect(screen.getByText(/using a demo sign-in/)).toBeInTheDocument();
    expect(screen.queryByText('Primary')).not.toBeInTheDocument();
  });

  it('connecting GitHub from the Profile dialog calls the same redirect as Settings :: Plugins', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ userProfile: { name: 'Ada', email: 'ada@example.com' }, authProvider: null });
    render(<ProfileModal />);

    await user.click(screen.getByRole('button', { name: 'Connect with GitHub' }));

    expect(redirectToProviderLink).toHaveBeenCalledWith('github');
  });

  it('disconnecting GitHub from the Profile dialog updates the shared store state', async () => {
    const user = userEvent.setup();
    useAppStore.getState().connectVersionControlProvider('github', { username: 'octocat' });
    useAppStore.setState({ userProfile: { name: 'Ada', email: 'ada@example.com' }, authProvider: null });
    render(<ProfileModal />);

    expect(screen.getByText('Connected as octocat')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(useAppStore.getState().versionControlLinks.github).toBeUndefined();
  });
});
