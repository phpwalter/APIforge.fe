import { apiGet, apiPatch, apiPost, apiUrl, ApiError } from './client';
import { clearAuthToken, getAuthToken, setAuthToken } from './authToken';

function response(overrides: Partial<Response> & { ok: boolean }): Response {
  return {
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve(''),
    json: () => Promise.resolve({}),
    ...overrides,
  } as Response;
}

function mockFetchOnce(value: Partial<Response> & { ok: boolean }) {
  const fetchMock = vi.fn().mockResolvedValue(response(value));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv('VITE_API_SERVER', 'http://api.test');
  clearAuthToken();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('apiUrl', () => {
  it('normalizes the configured server URL in tests', () => {
    vi.stubEnv('VITE_API_SERVER', 'http://api.test/');
    expect(apiUrl('things')).toBe('http://api.test/things');
  });

  it('fails closed when the server is not configured', () => {
    vi.stubEnv('VITE_API_SERVER', '');
    expect(() => apiUrl('/things')).toThrow(ApiError);
  });
});

describe('versioned requests', () => {
  it('sends the endpoint-specific API version and no token when signed out', async () => {
    const fetchMock = mockFetchOnce({ ok: true, json: () => Promise.resolve({ hello: 'world' }) });
    await expect(apiGet('/things', { apiVersion: 'v2' })).resolves.toEqual({ hello: 'world' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/things',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({ 'X-API-Version': 'v2', Accept: 'application/json' }),
      }),
    );
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('attaches the in-memory bearer token', async () => {
    setAuthToken('the-token');
    const fetchMock = mockFetchOnce({ ok: true, json: () => Promise.resolve({}) });
    await apiGet('/auth/me', { apiVersion: 'v1' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/auth/me',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer the-token' }) }),
    );
  });

  it('can explicitly suppress authentication for code exchange', async () => {
    setAuthToken('old-token');
    const fetchMock = mockFetchOnce({ ok: true, text: () => Promise.resolve('{}') });
    await apiPost('/auth/session/exchange', { apiVersion: 'v1', authenticated: false }, { code: 'abc' });
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('sends JSON POST and PATCH bodies', async () => {
    const postFetch = mockFetchOnce({ ok: true, text: () => Promise.resolve('{"ok":true}') });
    await apiPost('/things', { apiVersion: 'v1' }, { name: 'x' });
    expect(postFetch.mock.calls[0]?.[1]).toMatchObject({ method: 'POST', body: JSON.stringify({ name: 'x' }) });

    const patchFetch = mockFetchOnce({ ok: true, text: () => Promise.resolve('{"ok":true}') });
    await apiPatch('/things/1', { apiVersion: 'v3' }, { name: 'y' });
    expect(patchFetch.mock.calls[0]?.[1]).toMatchObject({ method: 'PATCH', body: JSON.stringify({ name: 'y' }) });
  });

  it('silently refreshes and retries once when a bearer token receives 401', async () => {
    setAuthToken('expired-token');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve(JSON.stringify({ title: 'Invalid Access Token' })),
      }))
      .mockResolvedValueOnce(response({
        ok: true,
        json: () => Promise.resolve({
          data: { token: { access_token: 'renewed-token', expires_in: 900 } },
        }),
      }))
      .mockResolvedValueOnce(response({
        ok: true,
        json: () => Promise.resolve({ value: 'saved' }),
      }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiGet('/projects', { apiVersion: 'v1' })).resolves.toEqual({ value: 'saved' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://api.test/auth/session/refresh',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
    expect(getAuthToken()).toBe('renewed-token');
    const retryHeaders = fetchMock.mock.calls[2]?.[1]?.headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe('Bearer renewed-token');
  });

  it('normalizes RFC 7807 errors without exposing arbitrary response bodies', async () => {
    mockFetchOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve(JSON.stringify({ title: 'Unauthorized', detail: 'A bearer token is required.' })),
    });
    await expect(apiGet('/auth/me', { apiVersion: 'v1' })).rejects.toMatchObject({
      status: 401,
      message: 'Unauthorized: A bearer token is required.',
    });
  });
});
