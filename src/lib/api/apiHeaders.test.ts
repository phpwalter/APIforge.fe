import { fetchApiHeaders, fetchResponseHeaderPolicy } from './apiHeaders';

const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it('loads the header catalog with status and inactive filters', async () => {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ data: [], meta: { count: 0, status_code: 405, include_inactive: false } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

  await fetchApiHeaders({ statusCode: 405, includeInactive: false });

  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/headers?statusCode=405&includeInactive=false'),
    expect.objectContaining({ method: 'GET' }),
  );
});

it('loads the status-specific response-header policy', async () => {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ data: [], meta: { count: 0, status_code: 401 } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

  await fetchResponseHeaderPolicy(401);

  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/headers/policies/401'),
    expect.objectContaining({ method: 'GET' }),
  );
});

it('rejects an invalid status code before making a request', async () => {
  await expect(fetchResponseHeaderPolicy(99)).rejects.toThrow('statusCode must be an integer from 100 through 599.');
  expect(fetchMock).not.toHaveBeenCalled();
});
