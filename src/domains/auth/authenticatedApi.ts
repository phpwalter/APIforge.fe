import { clearAuthSession, getAccessToken } from "./authSession";

const API_SERVER = (import.meta.env.VITE_API_SERVER ?? "http://localhost:8080").replace(/\/$/, "");

export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  method?: string;
  error_sub_code?: string;
  [key: string]: unknown;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly problem?: ProblemDetails,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export class AuthenticationRequiredError extends ApiRequestError {
  constructor(message: string, problem?: ProblemDetails) {
    super(message, 401, problem);
    this.name = "AuthenticationRequiredError";
  }
}

export type AuthenticatedRequestOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  requireBody?: boolean;
};

export async function authenticatedApiRequest<T>(
  path: string,
  options: AuthenticatedRequestOptions = {},
): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new AuthenticationRequiredError("No APIForge session is available.");
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("X-API-Version", "v1");

  const response = await fetch(resolveApiUrl(path), {
    ...options,
    headers,
    credentials: options.credentials ?? "include",
  });

  if (response.status === 401) {
    clearAuthSession();
    const problem = await readProblemDetails(response);
    throw new AuthenticationRequiredError(
      problem?.detail ?? "The APIForge session is no longer valid.",
      problem,
    );
  }

  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new ApiRequestError(
      problem?.detail ?? `API request failed with HTTP ${response.status}.`,
      response.status,
      problem,
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (text === "") {
    if (options.requireBody) {
      throw new ApiRequestError("The API returned an empty response body.", response.status);
    }
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiRequestError("The API returned invalid JSON.", response.status);
  }
}

function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_SERVER}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readProblemDetails(response: Response): Promise<ProblemDetails | undefined> {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("json")) return undefined;

  try {
    const value: unknown = await response.json();
    return value && typeof value === "object" ? (value as ProblemDetails) : undefined;
  } catch {
    return undefined;
  }
}
