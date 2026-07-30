import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { useAppStore } from './state/useAppStore';
import { useSpecStore } from './state/useSpecStore';
import { exchangeAuthorizationCode } from './lib/api/auth';
import { clearAuthToken, getAuthToken, setPendingAuthProvider, setPendingLinkProvider } from './lib/api/authToken';

vi.mock('./lib/api/auth', async () => {
  const actual = await vi.importActual<typeof import('./lib/api/auth')>('./lib/api/auth');
  return {
    ...actual,
    exchangeAuthorizationCode: vi.fn(),
  };
});

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
  clearAuthToken();
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');
  vi.mocked(exchangeAuthorizationCode).mockReset();
});

describe('App public OAuth callback route', () => {
  it('shows the landing page on the public root route', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('exchanges a callback returned to the frontend root before rendering sign in', async () => {
    window.history.replaceState({}, '', '/?code=root-code&provider=google');
    vi.mocked(exchangeAuthorizationCode).mockResolvedValue({
      user: { display_name: 'Ada Lovelace', email: 'ada@example.com' },
      token: { token_type: 'Bearer', access_token: 'root-memory-token', expires_in: 3600 },
    });

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Completing sign-in' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument();
    await waitFor(() => expect(useAppStore.getState().signedIn).toBe(true));
    expect(exchangeAuthorizationCode).toHaveBeenCalledWith('root-code', 'google');
    expect(getAuthToken()).toBe('root-memory-token');
    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('');
  });

  it('exchanges the callback code using the provider supplied by the backend', async () => {
    window.history.replaceState({}, '', '/oauth/callback?code=one-time&provider=google');
    vi.mocked(exchangeAuthorizationCode).mockResolvedValue({
      user: { display_name: 'Ada Lovelace', email: 'ada@example.com' },
      token: { token_type: 'Bearer', access_token: 'memory-token', expires_in: 3600 },
    });

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Completing sign-in' })).toBeInTheDocument();
    await waitFor(() => expect(useAppStore.getState().signedIn).toBe(true));
    expect(exchangeAuthorizationCode).toHaveBeenCalledWith('one-time', 'google');
    expect(getAuthToken()).toBe('memory-token');
    expect(localStorage.length).toBe(0);
    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('');
  });


  it('rejects a callback provider that conflicts with the pending sign-in request', async () => {
    setPendingAuthProvider('github');
    window.history.replaceState({}, '', '/oauth/callback?code=one-time&provider=google');

    render(<App />);

    expect(await screen.findByText(/does not match the sign-in request/i)).toBeInTheDocument();
    expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(useAppStore.getState().signedIn).toBe(false);
  });

  it('falls back to the pending provider when the callback omits provider', async () => {
    setPendingAuthProvider('github');
    window.history.replaceState({}, '', '/oauth/callback?code=one-time');
    vi.mocked(exchangeAuthorizationCode).mockResolvedValue({
      user: { display_name: 'Ada Lovelace', email: 'ada@example.com' },
      token: { access_token: 'memory-token' },
    });

    render(<App />);

    await waitFor(() => expect(useAppStore.getState().signedIn).toBe(true));
    expect(exchangeAuthorizationCode).toHaveBeenCalledWith('one-time', 'github');
  });

  it('shows a public error page when code or provider is missing', async () => {
    window.history.replaceState({}, '', '/oauth/callback?code=untrusted');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Sign-in failed' })).toBeInTheDocument();
    expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Return to sign in' })).toHaveAttribute('href', '/');
  });

  it('hydrates a linked version-control provider after exchange', async () => {
    setPendingLinkProvider('github');
    window.history.replaceState({}, '', '/oauth/callback?code=link-code&provider=github');
    vi.mocked(exchangeAuthorizationCode).mockResolvedValue({
      user: { display_name: 'Ada Lovelace', email: 'ada@example.com' },
      token: { access_token: 'renewed-token' },
      linked_profile: {
        provider: 'github',
        username: 'octocat',
        avatar_url: 'https://example.com/avatar.png',
      },
    });

    render(<App />);

    await waitFor(() => expect(useAppStore.getState().signedIn).toBe(true));
    expect(useAppStore.getState().versionControlLinks.github).toEqual({
      username: 'octocat',
      avatarUrl: 'https://example.com/avatar.png',
    });
  });

  it('shows the exchange failure without navigating to a protected page', async () => {
    window.history.replaceState({}, '', '/oauth/callback?code=expired&provider=google');
    vi.mocked(exchangeAuthorizationCode).mockRejectedValue(new Error('The authorization code has expired.'));

    render(<App />);

    expect(await screen.findByText('The authorization code has expired.')).toBeInTheDocument();
    expect(useAppStore.getState().signedIn).toBe(false);
    expect(window.location.pathname).toBe('/oauth/callback');
  });
});
