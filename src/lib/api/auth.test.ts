import {
  exchangeAuthorizationCode,
  fetchMe,
  readAuthLinkFromLocation,
  readAuthorizationCodeFromLocation,
  readOAuthCallbackFromLocation,
  redirectToProviderLink,
  redirectToProviderSignIn,
  signOutProvider,
  unlinkProvider,
  updateMe,
} from './auth';
import { apiPatch, apiPost, apiUrl } from './client';
import { takePendingAuthProvider, takePendingLinkProvider } from './authToken';

vi.mock('./client', () => ({
  apiGetResponse: vi.fn(),
  apiHead: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiUrl: vi.fn((path: string) => `http://api.test${path}`),
  ApiError: class extends Error {},
}));

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe('OAuth navigation', () => {
  it('records the sign-in provider and navigates to the backend bootstrap route', () => {
    const original = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, href: '' } });
    redirectToProviderSignIn('github');
    expect(apiUrl).toHaveBeenCalledWith('/auth/github/signin');
    expect(takePendingAuthProvider()).toBe('github');
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });

  it('begins an authenticated link and validates the authorization URL', async () => {
    vi.mocked(apiPost).mockResolvedValue({ data: { authorization_url: 'https://github.com/login/oauth/authorize' } });
    const original = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, href: '' } });
    await redirectToProviderLink('github');
    expect(apiPost).toHaveBeenCalledWith('/auth/github/link', { apiVersion: 'v1' });
    expect(takePendingLinkProvider()).toBe('github');
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });
});

describe('callback exchange', () => {
  it('reads the opaque code and normalized provider from the public callback URL', () => {
    expect(readOAuthCallbackFromLocation('?code=abc&provider=Google&state=x')).toEqual({
      code: 'abc',
      provider: 'google',
    });
    expect(readAuthorizationCodeFromLocation('?code=abc&provider=google')).toBe('abc');
    expect(readAuthorizationCodeFromLocation('?auth_session=legacy')).toBeNull();
  });

  it('posts the code and provider without authentication', async () => {
    vi.mocked(apiPost).mockResolvedValue({ data: {} });
    await exchangeAuthorizationCode('abc', 'google');
    expect(apiPost).toHaveBeenCalledWith(
      '/auth/session/exchange',
      { apiVersion: 'v1', authenticated: false },
      { code: 'abc', provider: 'google' },
    );
  });

  it('unwraps the API data envelope returned by the session exchange', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'user@example.com', display_name: 'Example User' },
        token: { token_type: 'Bearer', access_token: 'jwt-token', expires_in: 120 },
      },
      meta: { provider: 'google', new_user: false },
    });

    await expect(exchangeAuthorizationCode('abc', 'google')).resolves.toEqual({
      user: { id: 'user-1', email: 'user@example.com', display_name: 'Example User' },
      token: { token_type: 'Bearer', access_token: 'jwt-token', expires_in: 120 },
      new_user: false,
    });
  });

  it('still decodes the non-token linked-profile payload for backward compatibility', () => {
    const encoded = btoa(JSON.stringify({ provider: 'github', username: 'octocat' }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(readAuthLinkFromLocation(`?auth_link_session=${encoded}`)).toMatchObject({ username: 'octocat' });
  });
});

describe('authenticated-user response contract', () => {

  it('unwraps POST /auth/me and preserves record_version', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          display_name: 'Ada Lovelace',
          email: 'ada@example.com',
          record_version: 7,
        },
      },
      meta: {},
    });

    await expect(fetchMe()).resolves.toMatchObject({ record_version: 7 });
  });

  it('unwraps PATCH /auth/me and returns the incremented record_version', async () => {
    vi.mocked(apiPatch).mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          display_name: 'Ada Lovelace',
          email: 'ada@example.com',
          record_version: 8,
        },
      },
      meta: {},
    });

    await expect(updateMe({ record_version: 7, display_name: 'Ada Lovelace' })).resolves.toMatchObject({
      record_version: 8,
    });
  });

});

describe('versioned API wrappers', () => {
  it('uses explicit endpoint versions', () => {
    fetchMe();
    updateMe({ record_version: 3, display_name: 'Ada' });
    signOutProvider('google');
    unlinkProvider('google');
    expect(apiPost).toHaveBeenCalledWith('/auth/me', { apiVersion: 'v1' });
    expect(apiPatch).toHaveBeenCalledWith('/auth/me', { apiVersion: 'v1' }, { record_version: 3, display_name: 'Ada' });
    expect(apiPost).toHaveBeenCalledWith('/auth/google/signout', { apiVersion: 'v1' });
    expect(apiPost).toHaveBeenCalledWith('/auth/google/unlink', { apiVersion: 'v1' });
  });
});
