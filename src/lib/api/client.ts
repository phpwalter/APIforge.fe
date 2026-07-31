import { getAuthToken } from './authToken';

export interface ApiRequestOptions {
  /** API engine version required by this specific endpoint. */
  apiVersion: string;
  /** Set only for endpoints that intentionally do not require the active bearer token. */
  authenticated?: boolean;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
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

/**
 * Return an application-relative API endpoint.
 *
 * In development, Vite proxies /auth requests to the API server. In production,
 * the public web server must route the same /auth paths to the API service.
 * Keeping the browser request same-origin avoids CORS and preserves the canonical
 * endpoint path, for example GET /auth/providers and POST /auth/me.
 */
export function apiUrl(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function requestHeaders(base: Record<string, string>, options: ApiRequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-API-Version': options.apiVersion,
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

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  options: ApiRequestOptions,
  body?: unknown,
): Promise<T> {
  const url = apiUrl(path);
  let res: Response;

  try {
    res = await fetch(url, {
      method,
      headers: requestHeaders(body === undefined ? {} : { 'Content-Type': 'application/json' }, options),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    throw new ApiError(`Could not reach ${url}: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!res.ok) throw await newApiError(res, path);

  if (method === 'GET') {
    try {
      return (await res.json()) as T;
    } catch (err) {
      throw new ApiError(
        `${path} returned a response that was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

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

export function apiPost<T = void>(path: string, options: ApiRequestOptions, body?: unknown): Promise<T> {
  return request<T>('POST', path, options, body);
}

export function apiPatch<T = void>(path: string, options: ApiRequestOptions, body?: unknown): Promise<T> {
  return request<T>('PATCH', path, options, body);
}
