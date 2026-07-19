import { render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import App from './App';
import { useAppStore } from './state/useAppStore';
import { useSpecStore } from './state/useSpecStore';
import { fetchMe, linkProvider, readAuthSessionFromLocation } from './lib/api/auth';
import {
  getAuthToken,
  setAuthProvider,
  setAuthToken,
  setPendingAuthProvider,
  setPendingLinkProvider,
} from './lib/api/authToken';

// App boots by checking for a real backend session — keep that hermetic in tests rather than
// letting it hit the network, by always resolving to "not signed in" here by default.
vi.mock('./lib/api/auth', () => ({
  fetchMe: vi.fn(() => Promise.reject(new Error('not signed in'))),
  readAuthSessionFromLocation: vi.fn(() => null),
  linkProvider: vi.fn(() => Promise.resolve()),
}));

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
  vi.mocked(readAuthSessionFromLocation).mockReset().mockReturnValue(null);
  vi.mocked(fetchMe).mockReset().mockRejectedValue(new Error('not signed in'));
  vi.mocked(linkProvider).mockReset().mockResolvedValue(undefined);
  window.history.replaceState({}, '', '/');
  localStorage.clear();
  sessionStorage.clear();
});

describe('App', () => {
  it('shows the landing page when signed out', () => {
    render(<App />);
    expect(screen.getByText('APIforge')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('shows the app shell when signed in', () => {
    useAppStore.setState({ signedIn: true });
    render(<App />);
    expect(screen.getByText('No API document loaded')).toBeInTheDocument();
  });

  it('hydrates a real session from the OAuth callback\'s auth_session redirect param and strips it from the URL', async () => {
    window.history.replaceState({}, '', '/?auth_session=fake&foo=bar');
    vi.mocked(readAuthSessionFromLocation).mockReturnValue({
      user: { display_name: 'Walter Torres', email: 'otrwalter@gmail.com' },
      token: { access_token: 'the-token', token_type: 'Bearer', expires_in: 3600 },
    });

    render(<App />);

    await waitFor(() => expect(useAppStore.getState().signedIn).toBe(true));
    expect(useAppStore.getState().userProfile).toEqual({ name: 'Walter Torres', email: 'otrwalter@gmail.com' });
    expect(useAppStore.getState().authProvider).toBe('google');
    expect(getAuthToken()).toBe('the-token');

    // auth_session is one-time-use — it must not linger in the URL (bookmarkable, sent as a Referer, etc.)
    expect(window.location.search).toBe('?foo=bar');
  });

  it('maps bio/created_at/last_login_at from a real backend session into the profile', async () => {
    window.history.replaceState({}, '', '/?auth_session=fake');
    vi.mocked(readAuthSessionFromLocation).mockReturnValue({
      user: {
        display_name: 'Walter Torres',
        email: 'otrwalter@gmail.com',
        bio: 'Building APIforge',
        created_at: '2026-07-07 23:04:26.110224+00',
        last_login_at: '2026-07-15 04:13:55+00',
      },
      token: { access_token: 'the-token', token_type: 'Bearer', expires_in: 3600 },
    });

    render(<App />);

    await waitFor(() => expect(useAppStore.getState().signedIn).toBe(true));
    expect(useAppStore.getState().userProfile).toMatchObject({
      bio: 'Building APIforge',
      memberSince: '2026-07-07 23:04:26.110224+00',
      lastLoginAt: '2026-07-15 04:13:55+00',
    });
  });

  it('does not let StrictMode\'s double effect invocation re-fetch and clobber the profile with a thinner shape', async () => {
    window.history.replaceState({}, '', '/?auth_session=fake');
    vi.mocked(readAuthSessionFromLocation).mockReturnValue({
      user: { display_name: 'Walter Torres', email: 'otrwalter@gmail.com' },
      token: { access_token: 'the-token', token_type: 'Bearer', expires_in: 3600 },
    });
    // Simulates the real bug this guards against: /auth/me returning a much thinner object than
    // the auth_session redirect payload did (its documented schema is an empty `properties: {}`).
    vi.mocked(fetchMe).mockResolvedValue({});

    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    await waitFor(() => expect(useAppStore.getState().signedIn).toBe(true));
    expect(useAppStore.getState().userProfile).toEqual({ name: 'Walter Torres', email: 'otrwalter@gmail.com' });
    expect(fetchMe).not.toHaveBeenCalled();
  });

  it('tags the session with whichever provider was recorded as pending before the redirect (e.g. GitHub, not just Google)', async () => {
    setPendingAuthProvider('github');
    window.history.replaceState({}, '', '/?auth_session=fake');
    vi.mocked(readAuthSessionFromLocation).mockReturnValue({
      user: { display_name: 'Ada Lovelace', email: 'ada@example.com' },
      token: { access_token: 'the-token', token_type: 'Bearer', expires_in: 3600 },
    });

    render(<App />);

    await waitFor(() => expect(useAppStore.getState().signedIn).toBe(true));
    expect(useAppStore.getState().authProvider).toBe('github');
  });

  it('restores a session from a token stored on an earlier visit, tagged with that visit\'s provider', async () => {
    setAuthToken('stored-token');
    setAuthProvider('github');
    vi.mocked(fetchMe).mockResolvedValue({ display_name: 'Ada Lovelace', email: 'ada@example.com' });

    render(<App />);

    await waitFor(() => expect(useAppStore.getState().signedIn).toBe(true));
    expect(useAppStore.getState().authProvider).toBe('github');
    expect(useAppStore.getState().userProfile).toEqual({ name: 'Ada Lovelace', email: 'ada@example.com' });
  });

  it('does not attempt to restore a session from a token with no associated provider (inconsistent stored state)', async () => {
    setAuthToken('stored-token');
    // No setAuthProvider call — simulates leftover/corrupted state.

    render(<App />);

    await waitFor(() => expect(fetchMe).not.toHaveBeenCalled());
    expect(useAppStore.getState().signedIn).toBe(false);
  });

  it('a link redirect (Settings :: Version Control) registers the connected identity instead of replacing the active session', async () => {
    useAppStore.setState({ signedIn: true, userProfile: { name: 'Ada Lovelace', email: 'ada@example.com' }, authProvider: 'google' });
    setPendingLinkProvider('github');
    window.history.replaceState({}, '', '/?auth_session=fake');
    vi.mocked(readAuthSessionFromLocation).mockReturnValue({
      user: { username: 'octocat', display_name: 'The Octocat', avatar_url: 'https://example.com/octocat.png' },
      token: { access_token: 'github-linked-token', token_type: 'Bearer', expires_in: 3600 },
    });

    render(<App />);

    await waitFor(() => expect(linkProvider).toHaveBeenCalledWith('github'));
    await waitFor(() =>
      expect(useAppStore.getState().versionControlLinks).toEqual({
        github: { username: 'octocat', avatarUrl: 'https://example.com/octocat.png' },
      }),
    );

    // The primary session is untouched by the link — it must not be clobbered by the linked identity.
    expect(useAppStore.getState().authProvider).toBe('google');
    expect(useAppStore.getState().userProfile).toEqual({ name: 'Ada Lovelace', email: 'ada@example.com' });
    expect(getAuthToken()).toBeNull();
  });

  it('restores the primary signed-in session from a real stored token after a link redirect completes', async () => {
    // Simulates the real scenario the earlier test doesn't: the user was actually signed in (a
    // real token+provider in localStorage) before clicking "Connect with GitHub", not just
    // in-memory store state — so the fresh page load after the redirect starts fully signed out
    // until the bootstrap effect restores it.
    setAuthToken('stored-token');
    setAuthProvider('google');
    vi.mocked(fetchMe).mockResolvedValue({ display_name: 'Ada Lovelace', email: 'ada@example.com' });
    setPendingLinkProvider('github');
    window.history.replaceState({}, '', '/?auth_session=fake');
    vi.mocked(readAuthSessionFromLocation).mockReturnValue({
      user: { username: 'octocat' },
      token: { access_token: 'github-linked-token', token_type: 'Bearer', expires_in: 3600 },
    });

    render(<App />);

    await waitFor(() => expect(linkProvider).toHaveBeenCalledWith('github'));
    // The link round trip alone must not leave the app stuck signed out.
    await waitFor(() => expect(useAppStore.getState().signedIn).toBe(true));
    expect(useAppStore.getState().authProvider).toBe('google');
    expect(useAppStore.getState().userProfile).toEqual({ name: 'Ada Lovelace', email: 'ada@example.com' });
  });

  it('shows a loading splash — neither the landing page nor the app shell — while a stored session is still being verified', async () => {
    setAuthToken('stored-token');
    setAuthProvider('github');
    let resolveFetchMe: (me: { display_name: string; email: string }) => void = () => {};
    vi.mocked(fetchMe).mockReturnValue(new Promise((resolve) => (resolveFetchMe = resolve)));

    render(<App />);

    expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument();
    expect(screen.queryByText('No API document loaded')).not.toBeInTheDocument();

    resolveFetchMe({ display_name: 'Ada Lovelace', email: 'ada@example.com' });
    await waitFor(() => expect(useAppStore.getState().signedIn).toBe(true));
  });
});
