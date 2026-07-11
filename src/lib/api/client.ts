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

export async function apiGet<T>(path: string): Promise<T> {
  const url = `${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' } });
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
