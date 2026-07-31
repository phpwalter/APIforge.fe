import { checkAuthProviders, fetchAuthProviders } from '../../lib/api/auth';
import { clearAuthProviderCacheForTests, loadAuthProviders } from './providers';

vi.mock('../../lib/api/auth', () => ({
  checkAuthProviders: vi.fn(),
  fetchAuthProviders: vi.fn(),
}));

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
];

beforeEach(() => {
  clearAuthProviderCacheForTests();
  vi.clearAllMocks();
});

describe('OAuth provider session cache', () => {
  it('uses GET directly when no session cache exists', async () => {
    vi.mocked(fetchAuthProviders).mockResolvedValue({ providers, etag: '"providers-v1"', notModified: false });

    await expect(loadAuthProviders()).resolves.toEqual(providers);
    expect(checkAuthProviders).not.toHaveBeenCalled();
    expect(fetchAuthProviders).toHaveBeenCalledWith();
  });

  it('uses HEAD with If-None-Match and reuses cached providers after 304', async () => {
    vi.mocked(fetchAuthProviders).mockResolvedValueOnce({ providers, etag: '"providers-v1"', notModified: false });
    await loadAuthProviders();

    // Clear only the in-memory module state while preserving the browser-session cache.
    vi.resetModules();
    const auth = await import('../../lib/api/auth');
    vi.mocked(auth.checkAuthProviders).mockResolvedValue({ providers: [], etag: '"providers-v1"', notModified: true });
    const providerModule = await import('./providers');

    await expect(providerModule.loadAuthProviders()).resolves.toEqual(providers);
    expect(auth.checkAuthProviders).toHaveBeenCalledWith('"providers-v1"');
  });

  it('falls back to GET when HEAD fails', async () => {
    vi.mocked(fetchAuthProviders).mockResolvedValueOnce({ providers, etag: '"providers-v1"', notModified: false });
    await loadAuthProviders();

    vi.resetModules();
    const auth = await import('../../lib/api/auth');
    vi.mocked(auth.checkAuthProviders).mockRejectedValue(new Error('HEAD failed'));
    vi.mocked(auth.fetchAuthProviders).mockResolvedValue({ providers, etag: '"providers-v2"', notModified: false });
    const providerModule = await import('./providers');

    await expect(providerModule.loadAuthProviders()).resolves.toEqual(providers);
    expect(auth.fetchAuthProviders).toHaveBeenCalledWith('"providers-v1"');
  });
});
