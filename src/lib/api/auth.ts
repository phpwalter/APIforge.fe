import { apiGet, apiPost, apiUrl } from './client';
import { setPendingAuthProvider } from './authToken';

/**
 * The backend's /auth/me schema isn't fleshed out in the imported OpenAPI document (empty
 * `properties: {}`), so this is deliberately permissive — read known-likely fields defensively
 * rather than assuming an exact shape.
 */
export interface MeResponse {
  id?: string;
  name?: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
  [key: string]: unknown;
}

/**
 * Full-page navigation to the backend's own OAuth entry point — per the imported spec, GET
 * /auth/{provider} redirects the browser straight to the provider's consent screen and the
 * backend owns the entire code exchange (it already holds the client id/secret). The frontend
 * never touches either.
 */
export function redirectToProviderSignIn(provider: string): void {
  // The auth_session payload the callback returns doesn't say which provider produced it —
  // remember it here so the app can tag the session correctly once the browser comes back.
  setPendingAuthProvider(provider);
  window.location.href = apiUrl(`/auth/${provider}`);
}

export interface AuthSessionUser {
  id?: string;
  email?: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  [key: string]: unknown;
}

export interface AuthSessionPayload {
  user?: AuthSessionUser;
  token?: { token_type?: string; access_token?: string; expires_in?: number };
  new_user?: boolean;
}

/** The payload is base64url (- and _, no padding), which the browser's atob() doesn't accept directly. */
function base64UrlToBase64(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  return base64 + '='.repeat((4 - (base64.length % 4)) % 4);
}

/**
 * This backend is bearer-token only — no session cookie. Instead, /auth/{provider}/callback
 * redirects back to the frontend with `?auth_session=<base64url JSON>` carrying the user profile
 * and access token together. Returns null if the param is absent or malformed.
 */
export function readAuthSessionFromLocation(search: string): AuthSessionPayload | null {
  const raw = new URLSearchParams(search).get('auth_session');
  if (!raw) return null;
  try {
    return JSON.parse(atob(base64UrlToBase64(raw))) as AuthSessionPayload;
  } catch {
    return null;
  }
}

export function fetchMe(): Promise<MeResponse> {
  return apiGet<MeResponse>('/auth/me');
}

export function signOutProvider(provider: string): Promise<void> {
  return apiPost<void>(`/auth/${provider}/signout`);
}

export function linkProvider(provider: string): Promise<void> {
  return apiPost<void>(`/auth/${provider}/link`);
}

export function unlinkProvider(provider: string): Promise<void> {
  return apiPost<void>(`/auth/${provider}/unlink`);
}
