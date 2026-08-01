import { apiGet, apiPatch, apiPost, apiUrl } from './client';
import { clearAuthToken, setAuthToken } from './authToken';

function mockFetchOnce(response: Partial<Response> & { ok: boolean }) {
  const fullResponse = {
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve(''),
    json: () => Promise.resolve({}),
    ...response,
  };
  const fetchMock = vi.fn().mockResolvedValue(fullResponse as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  clearAuthToken();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('apiUrl', () => {
  it('returns a same-origin path during development and tests', () => {
    expect(apiUrl('things')).toBe('/things');
    expect(apiUrl('/auth/providers')).toBe('/auth/providers');
  });
});

describe('versioned requests', () => {
  it('sends the endpoint-specific API version and no token when signed out', async () => {
    const fetchMock = mockFetchOnce({ ok: true, json: () => Promise.resolve({ hello: 'world' }) });
    await expect(apiGet('/things', { apiVersion: 'v2' })).resolves.toEqual({ hello: 'world' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/things',
      expect.objectContaining({
        method: 'GET',
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
      '/auth/me',
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
