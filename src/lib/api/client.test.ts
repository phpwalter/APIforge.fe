import { apiGet, apiPatch, apiPost, apiUrl, ApiError } from './client';
import { setAuthToken } from './authToken';

function mockFetchOnce(response: Partial<Response> & { ok: boolean }) {
  const fetchMock = vi.fn().mockResolvedValue(response as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv('VITE_API_SERVER', 'http://api.test');
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('apiUrl', () => {
  it('joins the base URL and a leading-slash path', () => {
    expect(apiUrl('/things')).toBe('http://api.test/things');
  });

  it('adds the leading slash if the caller omitted it', () => {
    expect(apiUrl('things')).toBe('http://api.test/things');
  });

  it('strips a trailing slash from VITE_API_SERVER', () => {
    vi.stubEnv('VITE_API_SERVER', 'http://api.test/');
    expect(apiUrl('/things')).toBe('http://api.test/things');
  });

  it('throws when VITE_API_SERVER is unset', () => {
    vi.stubEnv('VITE_API_SERVER', '');
    expect(() => apiUrl('/things')).toThrow(ApiError);
  });
});

describe('apiGet', () => {
  it('has no Authorization header when no token is stored, and returns the parsed body', async () => {
    const fetchMock = mockFetchOnce({ ok: true, json: () => Promise.resolve({ hello: 'world' }) });
    const result = await apiGet('/things');
    expect(result).toEqual({ hello: 'world' });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).not.toHaveProperty('Authorization');
  });

  it('attaches the stored bearer token, since this API is bearer-token only (no session cookie)', async () => {
    setAuthToken('the-token');
    const fetchMock = mockFetchOnce({ ok: true, json: () => Promise.resolve({}) });
    await apiGet('/auth/me');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/auth/me',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer the-token' }) }),
    );
  });

  it('throws an ApiError with the status on a non-2xx response', async () => {
    mockFetchOnce({ ok: false, status: 404, statusText: 'Not Found' });
    await expect(apiGet('/missing')).rejects.toMatchObject({ status: 404 });
  });

  it('throws an ApiError when the network request itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(apiGet('/things')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('apiPost', () => {
  it('sends a JSON body and the bearer token when both are present', async () => {
    setAuthToken('the-token');
    const fetchMock = mockFetchOnce({ ok: true, text: () => Promise.resolve('{"ok":true}') });
    const result = await apiPost('/things', { name: 'x' });
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/things',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'x' }),
        headers: expect.objectContaining({ Authorization: 'Bearer the-token' }),
      }),
    );
  });

  it('resolves to undefined for an empty response body (e.g. a signout endpoint)', async () => {
    mockFetchOnce({ ok: true, text: () => Promise.resolve('') });
    const result = await apiPost('/auth/google/signout');
    expect(result).toBeUndefined();
  });

  it('throws an ApiError on a non-2xx response', async () => {
    mockFetchOnce({ ok: false, status: 401, statusText: 'Unauthorized' });
    await expect(apiPost('/auth/google/link')).rejects.toMatchObject({ status: 401 });
  });
});

describe('apiPatch', () => {
  it('sends a JSON body, the PATCH method, and the bearer token when present', async () => {
    setAuthToken('the-token');
    const fetchMock = mockFetchOnce({ ok: true, text: () => Promise.resolve('{"ok":true}') });
    const result = await apiPatch('/auth/me', { display_name: 'Ada' });
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/auth/me',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ display_name: 'Ada' }),
        headers: expect.objectContaining({ Authorization: 'Bearer the-token' }),
      }),
    );
  });

  it('resolves to undefined for an empty response body', async () => {
    mockFetchOnce({ ok: true, text: () => Promise.resolve('') });
    const result = await apiPatch('/auth/me', { bio: 'x' });
    expect(result).toBeUndefined();
  });

  it('throws an ApiError on a non-2xx response', async () => {
    mockFetchOnce({ ok: false, status: 400, statusText: 'Bad Request' });
    await expect(apiPatch('/auth/me', {})).rejects.toMatchObject({ status: 400 });
  });
});
