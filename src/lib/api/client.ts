import { getAuthToken } from './authToken';

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

async function executeRequest(
  method: 'GET' | 'HEAD' | 'POST' | 'PATCH',
  path: string,
  options: ApiRequestOptions,
  body?: unknown,
): Promise<Response> {
  const url = apiUrl(path);

  try {
    return await fetch(url, {
      method,
      headers: requestHeaders(body === undefined ? {} : { 'Content-Type': 'application/json' }, options),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
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
