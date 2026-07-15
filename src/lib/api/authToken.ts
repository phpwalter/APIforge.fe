/**
 * The backend is bearer-token only (no session cookie) — GET /auth/me responds 401 "Missing
 * bearer token" without one. The token itself arrives via the OAuth callback redirect's
 * auth_session payload (see App.tsx) and is kept here so it survives a page reload. The provider
 * is stored alongside it — needed to call the right /auth/{provider}/signout endpoint later,
 * since the redirect payload itself doesn't say which provider produced it.
 */
const TOKEN_KEY = 'apiforge_auth_token';
const PROVIDER_KEY = 'apiforge_auth_provider';
/** Session-scoped: only needed for the moment between the redirect out and the callback's return. */
const PENDING_PROVIDER_KEY = 'apiforge_pending_auth_provider';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthProvider(): string | null {
  return localStorage.getItem(PROVIDER_KEY);
}

export function setAuthProvider(provider: string): void {
  localStorage.setItem(PROVIDER_KEY, provider);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROVIDER_KEY);
}

/** Recorded right before redirecting to the backend's OAuth entry point for a given provider. */
export function setPendingAuthProvider(provider: string): void {
  sessionStorage.setItem(PENDING_PROVIDER_KEY, provider);
}

/** Reads and clears the pending provider — one-shot, matching the one-shot auth_session redirect param. */
export function takePendingAuthProvider(): string | null {
  const provider = sessionStorage.getItem(PENDING_PROVIDER_KEY);
  sessionStorage.removeItem(PENDING_PROVIDER_KEY);
  return provider;
}
