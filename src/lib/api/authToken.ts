/**
 * The backend is bearer-token only (no session cookie) — GET /auth/me responds 401 "Missing
 * bearer token" without one. The token itself arrives via the OAuth callback redirect's
 * auth_session payload (see App.tsx) and is kept here so it survives a page reload.
 */
const STORAGE_KEY = 'apiforge_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}
