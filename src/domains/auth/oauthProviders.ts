export type OAuthProviderCode = "google" | "github" | string;

export interface OAuthProvider {
  code: OAuthProviderCode;
  display_name: string;
  supports_pkce: boolean;
  supports_oidc: boolean;
  default_scopes: string[];
  signin_endpoint: string;
  callback_endpoint: string;
  exchange_endpoint: string;
  display_order: number;
}

interface OAuthProviderEnvelope {
  data: OAuthProvider[];
}

const API_SERVER = (import.meta.env.VITE_API_SERVER ?? "http://localhost:8080").replace(/\/$/, "");

export class OAuthProviderCatalogError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "OAuthProviderCatalogError";
  }
}

export async function fetchOAuthProviders(signal?: AbortSignal): Promise<OAuthProvider[]> {
  const response = await fetch(`${API_SERVER}/auth/providers`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-API-Version": "v1",
    },
    signal,
  });

  if (!response.ok) {
    throw new OAuthProviderCatalogError(
      `OAuth providers request failed with HTTP ${response.status}.`,
      response.status,
    );
  }

  const payload = (await response.json()) as Partial<OAuthProviderEnvelope>;
  if (!Array.isArray(payload.data)) {
    throw new OAuthProviderCatalogError("OAuth providers response did not contain a data array.");
  }

  return payload.data
    .filter(isOAuthProvider)
    .sort((left, right) => left.display_order - right.display_order);
}

export function beginOAuthSignin(provider: OAuthProvider): void {
  const endpoint = provider.signin_endpoint.startsWith("http")
    ? provider.signin_endpoint
    : `${API_SERVER}${provider.signin_endpoint}`;
  window.location.assign(endpoint);
}

function isOAuthProvider(value: unknown): value is OAuthProvider {
  if (!value || typeof value !== "object") return false;
  const provider = value as Record<string, unknown>;

  return (
    typeof provider.code === "string" &&
    typeof provider.display_name === "string" &&
    typeof provider.signin_endpoint === "string" &&
    typeof provider.callback_endpoint === "string" &&
    provider.exchange_endpoint === "/auth/session/exchange" &&
    typeof provider.display_order === "number" &&
    Array.isArray(provider.default_scopes)
  );
}
