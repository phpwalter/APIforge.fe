import {
  clearAccessToken,
  getAuthToken,
  getAuthTokenExpiresAt,
  setAuthToken,
} from './authToken';

export interface ApiRequestOptions {
  /** API engine version required by this specific endpoint. */
  apiVersion: string;
  /** Set only for endpoints that intentionally do not require the active bearer token. */
  authenticated?: boolean;
  /** Additional request headers, such as If-None-Match for conditional requests. */
  headers?: Record<string, string>;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export interface ApiHeadResponse {
  status: number;
  headers: Headers;
}

export class ApiError extends Error {
  status?: number;
  problem?: ProblemDetails;

  constructor(message: string, status?: number, problem?: ProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

const REFRESH_WINDOW_MS = 60_000;
const REFRESH_LOCK_NAME = 'apiforge-auth-refresh';
let refreshPromise: Promise<boolean> | null = null;

function baseUrl(): string {
  const url = import.meta.env.VITE_API_SERVER;
  if (!url) {
    throw new ApiError(
      'VITE_API_SERVER is not set — copy .env.example to .env.local and configure the API server URL.',
    );
  }
  return url.replace(/\/+$/, '');
}

/** Return an absolute API endpoint without adding an /api prefix. */
export function apiUrl(path: string): string {
  const finalPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl()}${finalPath}`;
}

function requestHeaders(base: Record<string, string>, options: ApiRequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-API-Version': options.apiVersion,
    ...options.headers,
    ...base,
  };

  if (options.authenticated !== false) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

async function newApiError(res: Response, path: string): Promise<ApiError> {
  const text = await res.text();
  let problem: ProblemDetails | undefined;

  if (text) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (isProblemDetails(parsed)) problem = parsed;
    } catch {
      // Non-JSON error bodies are intentionally not copied into user-facing messages.
    }
  }

  const message = problem?.title
    ? `${problem.title}${problem.detail ? `: ${problem.detail}` : ''}`
    : `${path} responded ${res.status} ${res.statusText}`;

  return new ApiError(message, res.status, problem);
}

function accessTokenNeedsRefresh(): boolean {
  if (!getAuthToken()) return false;
  const expiresAt = getAuthTokenExpiresAt();
  return expiresAt !== null && expiresAt - Date.now() <= REFRESH_WINDOW_MS;
}

async function performRefresh(): Promise<boolean> {
  let response: Response;
  try {
    response = await fetch(apiUrl('/auth/session/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-API-Version': 'v1',
      },
    });
  } catch {
    return false;
  }

  if (!response.ok) {
    if (response.status === 401) clearAccessToken();
    return false;
  }

  try {
    const payload = (await response.json()) as {
      data?: { token?: { access_token?: string; expires_in?: number } };
    };
    const accessToken = payload.data?.token?.access_token?.trim();
    if (!accessToken) return false;
    setAuthToken(accessToken, payload.data?.token?.expires_in);
    return true;
  } catch {
    return false;
  }
}

async function performRefreshWithBrowserLock(): Promise<boolean> {
  const lockManager = typeof navigator !== 'undefined'
    ? (navigator as Navigator & {
        locks?: { request<T>(name: string, callback: () => Promise<T>): Promise<T> };
      }).locks
    : undefined;

  // The HttpOnly refresh cookie is shared by tabs. Serializing rotation across
  // same-origin tabs prevents two requests from trying to consume the same
  // single-use refresh credential at the same time.
  return lockManager
    ? lockManager.request(REFRESH_LOCK_NAME, performRefresh)
    : performRefresh();
}

export async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = performRefreshWithBrowserLock().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function fetchRequest(
  method: 'GET' | 'HEAD' | 'POST' | 'PATCH',
  path: string,
  options: ApiRequestOptions,
  body?: unknown,
): Promise<Response> {
  return fetch(apiUrl(path), {
    method,
    credentials: 'include',
    headers: requestHeaders(body === undefined ? {} : { 'Content-Type': 'application/json' }, options),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function executeRequest(
  method: 'GET' | 'HEAD' | 'POST' | 'PATCH',
  path: string,
  options: ApiRequestOptions,
  body?: unknown,
): Promise<Response> {
  const authenticated = options.authenticated !== false;
  const url = apiUrl(path);

  try {
    if (authenticated && accessTokenNeedsRefresh()) {
      await refreshAccessToken();
    }

    let response = await fetchRequest(method, path, options, body);

    // The proactive refresh is an optimization. A 401 remains authoritative and
    // gets exactly one refresh + one retry to cover expiry races and clock skew.
    if (authenticated && response.status === 401 && getAuthToken()) {
      const refreshed = await refreshAccessToken();
      if (refreshed) response = await fetchRequest(method, path, options, body);
    }

    return response;
  } catch (err) {
    throw new ApiError(`Could not reach ${url}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function parseJsonResponse<T>(res: Response, path: string): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch (err) {
    throw new ApiError(
      `${path} returned a response that was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  options: ApiRequestOptions,
  body?: unknown,
): Promise<T> {
  const res = await executeRequest(method, path, options, body);
  if (!res.ok) throw await newApiError(res, path);

  if (method === 'GET') return parseJsonResponse<T>(res, path);

  const text = await res.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new ApiError(
      `${path} returned a response that was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export function apiGet<T>(path: string, options: ApiRequestOptions): Promise<T> {
  return request<T>('GET', path, options);
}

export async function apiGetResponse<T>(path: string, options: ApiRequestOptions): Promise<ApiResponse<T> | ApiHeadResponse> {
  const res = await executeRequest('GET', path, options);
  if (res.status === 304) return { status: res.status, headers: res.headers };
  if (!res.ok) throw await newApiError(res, path);
  return { data: await parseJsonResponse<T>(res, path), status: res.status, headers: res.headers };
}

export async function apiHead(path: string, options: ApiRequestOptions): Promise<ApiHeadResponse> {
  const res = await executeRequest('HEAD', path, options);
  if (res.status !== 304 && !res.ok) throw await newApiError(res, path);
  return { status: res.status, headers: res.headers };
}

export function apiPost<T = void>(path: string, options: ApiRequestOptions, body?: unknown): Promise<T> {
  return request<T>('POST', path, options, body);
}

export function apiPatch<T = void>(path: string, options: ApiRequestOptions, body?: unknown): Promise<T> {
  return request<T>('PATCH', path, options, body);
}
