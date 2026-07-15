import { render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import App from './App';
import { useAppStore } from './state/useAppStore';
import { useSpecStore } from './state/useSpecStore';
import { fetchMe, readAuthSessionFromLocation } from './lib/api/auth';
import { getAuthToken, setAuthProvider, setAuthToken, setPendingAuthProvider } from './lib/api/authToken';

// App boots by checking for a real backend session — keep that hermetic in tests rather than
// letting it hit the network, by always resolving to "not signed in" here by default.
vi.mock('./lib/api/auth', () => ({
  fetchMe: vi.fn(() => Promise.reject(new Error('not signed in'))),
  readAuthSessionFromLocation: vi.fn(() => null),
}));

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
  vi.mocked(readAuthSessionFromLocation).mockReset().mockReturnValue(null);
  vi.mocked(fetchMe).mockReset().mockRejectedValue(new Error('not signed in'));
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
});
