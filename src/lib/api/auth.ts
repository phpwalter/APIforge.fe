import { apiGet, apiPatch, apiPost, apiUrl } from './client';
import { setPendingAuthProvider, setPendingLinkProvider } from './authToken';

/**
 * The backend's /auth/me schema isn't fleshed out in the imported OpenAPI document (empty
 * `properties: {}`), so this is deliberately permissive — read known-likely fields defensively
 * rather than assuming an exact shape. The optional fields beyond id/email/avatar_url are grounded
 * in a real captured GET /auth/me response (see auth.test.ts's base64url fixture), not guessed.
 */
export interface MeResponse {
  id?: string;
  name?: string;
  display_name?: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  last_login_at?: string;
  use_gravatar?: boolean;
  gravatar_email?: string;
  [key: string]: unknown;
}

/**
 * Full-page navigation to the backend's own OAuth entry point for signing in — GET
 * /auth/{provider}/signin redirects the browser straight to the provider's consent screen and the
 * backend owns the entire code exchange (it already holds the client id/secret). The frontend
 * never touches either. (GET /auth/{provider} with no suffix no longer exists — 404s.)
 */
export function redirectToProviderSignIn(provider: string): void {
  // The auth_session payload the callback returns doesn't say which provider produced it —
  // remember it here so the app can tag the session correctly once the browser comes back.
  setPendingAuthProvider(provider);
  window.location.href = apiUrl(`/auth/${provider}/signin`);
}

interface BeginAuthorizationResponse {
  data?: { authorization_url?: string };
}

/**
 * Begins linking an additional provider to the already-signed-in account. Unlike sign-in,
 * this can't be a bare full-page navigation — the backend needs the bearer token to know
 * *which* signed-in user to attach the identity to, and a plain `window.location.href` can't
 * carry an Authorization header. So this first calls the authenticated POST /auth/{provider}/link
 * (which returns an authorization_url the same shape POST /auth/{provider} does for sign-in),
 * then navigates the browser there. Records the provider as pending-LINK so the callback's
 * return (App.tsx) attaches it to the current account instead of treating it as a fresh
 * sign-in — the actual link happens server-side when GET /auth/{provider}/callback completes,
 * so there's no separate "finalize" call needed on return (used by Settings :: Plugins / the
 * Profile dialog's Linked Profiles to connect e.g. GitHub via real OAuth).
 */
export async function redirectToProviderLink(provider: string): Promise<void> {
  try {
    const result = await apiPost<BeginAuthorizationResponse>(`/auth/${provider}/link`);
    const authorizationUrl = result.data?.authorization_url;
    if (!authorizationUrl) return;
    setPendingLinkProvider(provider);
    window.location.href = authorizationUrl;
  } catch {
    // Nothing to recover to here beyond leaving the user on the current page — the connect
    // button simply does nothing, matching how unlinkProvider() below fails silently too.
  }
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

export interface AuthLinkPayload {
  provider?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

/**
 * Mirrors readAuthSessionFromLocation but for a completed *link* round trip — the callback
 * sends back `?auth_link_session=<base64url JSON>` instead of `auth_session` (no token, since
 * linking doesn't touch the active session), carrying just enough of the newly-linked profile
 * to update the UI without an extra round trip.
 */
export function readAuthLinkFromLocation(search: string): AuthLinkPayload | null {
  const raw = new URLSearchParams(search).get('auth_link_session');
  if (!raw) return null;
  try {
    return JSON.parse(atob(base64UrlToBase64(raw))) as AuthLinkPayload;
  } catch {
    return null;
  }
}

export function fetchMe(): Promise<MeResponse> {
  return apiGet<MeResponse>('/auth/me');
}

/**
 * The imported spec documents PATCH /auth/me as "Update authenticated user settings" but its
 * request body schema is empty (no example was ever captured) — this sends the subset of
 * MeResponse's fields that plausibly look user-editable (name/bio), mirroring the shape GET
 * returns. Adjust field names here if the real backend expects something different.
 */
export interface UpdateMeRequest {
  display_name?: string;
  bio?: string;
  use_gravatar?: boolean;
  gravatar_email?: string;
}

export function updateMe(patch: UpdateMeRequest): Promise<MeResponse> {
  return apiPatch<MeResponse>('/auth/me', patch);
}

export function signOutProvider(provider: string): Promise<void> {
  return apiPost<void>(`/auth/${provider}/signout`);
}

export function unlinkProvider(provider: string): Promise<void> {
  return apiPost<void>(`/auth/${provider}/unlink`);
}