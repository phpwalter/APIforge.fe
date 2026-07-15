import { getAuthToken } from './authToken';

/**
 * Thrown for any non-2xx response or network failure from apiGet/apiFetch,
 * so callers can distinguish "server said no" from "couldn't reach it".
 */
export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function baseUrl(): string {
  const url = import.meta.env.VITE_API_SERVER;
  if (!url) {
    throw new ApiError(
      'VITE_API_SERVER is not set — copy .env.example to .env (or .env.local) and set it to your API server URL.',
    );
  }
  return url.replace(/\/+$/, '');
}

/** Full URL for a server-relative path — also used for full-page navigations (e.g. an OAuth redirect), not just fetch. */
export function apiUrl(path: string): string {
  return `${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

/** The API is bearer-token only (no session cookie) — attach one whenever we have it. */
function authHeaders(base: Record<string, string>): Record<string, string> {
  const token = getAuthToken();
  return token ? { ...base, Authorization: `Bearer ${token}` } : base;
}

export async function apiGet<T>(path: string): Promise<T> {
  const url = apiUrl(path);
  let res: Response;
  try {
    res = await fetch(url, { headers: authHeaders({ Accept: 'application/json' }) });
  } catch (err) {
    throw new ApiError(`Could not reach ${url}: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok) {
    throw new ApiError(`${path} responded ${res.status} ${res.statusText}`, res.status);
  }
  try {
    return (await res.json()) as T;
  } catch (err) {
    throw new ApiError(
      `${path} returned a response that wasn't valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/** POST with the bearer token attached when present — the response body may be empty (e.g. a signout endpoint). */
export async function apiPost<T = void>(path: string, body?: unknown): Promise<T> {
  const url = apiUrl(path);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: authHeaders(
        body !== undefined ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      ),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(`Could not reach ${url}: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok) {
    throw new ApiError(`${path} responded ${res.status} ${res.statusText}`, res.status);
  }
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new ApiError(
      `${path} returned a response that wasn't valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
