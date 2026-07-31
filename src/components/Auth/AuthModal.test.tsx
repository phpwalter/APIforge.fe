import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthModal } from './AuthModal';
import { clearAuthProviderCacheForTests } from './providers';
import { useAppStore } from '../../state/useAppStore';
import { checkAuthProviders, fetchAuthProviders, redirectToProviderSignIn } from '../../lib/api/auth';

vi.mock('../../lib/api/auth', () => ({
  checkAuthProviders: vi.fn(),
  fetchAuthProviders: vi.fn(),
  redirectToProviderSignIn: vi.fn(),
}));

const initialState = useAppStore.getState();
const providers = [
  {
    code: 'google',
    display_name: 'Google',
    supports_pkce: true,
    supports_oidc: true,
    signin_endpoint: '/auth/google/signin',
    callback_endpoint: '/auth/google/callback',
    exchange_endpoint: '/auth/google/exchange',
    display_order: 10,
  },
  {
    code: 'github',
    display_name: 'GitHub',
    supports_pkce: false,
    supports_oidc: false,
    signin_endpoint: '/auth/github/signin',
    callback_endpoint: '/auth/github/callback',
    exchange_endpoint: '/auth/github/exchange',
    display_order: 20,
  },
];

beforeEach(() => {
  useAppStore.setState(initialState, true);
  clearAuthProviderCacheForTests();
  vi.clearAllMocks();
  vi.mocked(fetchAuthProviders).mockResolvedValue({ providers, etag: '"providers-v1"', notModified: false });
  vi.mocked(checkAuthProviders).mockResolvedValue({ providers: [], etag: '"providers-v1"', notModified: true });
});

describe('AuthModal — backend provider registry', () => {
  it('loads providers from the backend and redirects through the returned signin endpoint', async () => {
    const user = userEvent.setup();
    render(<AuthModal />);

    const githubButton = await screen.findByRole('button', { name: /GitHub/ });
    await user.click(githubButton);

    expect(fetchAuthProviders).toHaveBeenCalledTimes(1);
    expect(redirectToProviderSignIn).toHaveBeenCalledWith('github', '/auth/github/signin');
    expect(screen.getByRole('button', { name: /Google/ })).toBeDisabled();
    expect(githubButton).toBeDisabled();
  });

  it('shows the empty-provider message when the backend returns no active providers', async () => {
    vi.mocked(fetchAuthProviders).mockResolvedValue({ providers: [], etag: '"providers-empty"', notModified: false });
    render(<AuthModal />);
    expect(await screen.findByText('No sign-in providers are currently available.')).toBeInTheDocument();
  });

  it('shows an error and retries the provider request', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchAuthProviders)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ providers, etag: '"providers-v1"', notModified: false });

    render(<AuthModal />);
    expect(await screen.findByText('Sign-in providers could not be loaded.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Google/ })).toBeInTheDocument());
    expect(fetchAuthProviders).toHaveBeenCalledTimes(2);
  });
});
