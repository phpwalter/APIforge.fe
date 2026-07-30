/**
 * Bearer credentials are deliberately kept in module memory only. They are never written to
 * localStorage, sessionStorage, IndexedDB, cookies, or the URL. A full page reload therefore
 * ends the frontend session until the backend supplies a secure refresh mechanism.
 */
let authToken: string | null = null;
let authProvider: string | null = null;

const PENDING_PROVIDER_KEY = 'apiforge_pending_auth_provider';
const PENDING_LINK_PROVIDER_KEY = 'apiforge_pending_link_provider';

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthToken(token: string): void {
  authToken = token;
}

export function getAuthProvider(): string | null {
  return authProvider;
}

export function setAuthProvider(provider: string): void {
  authProvider = provider;
}

export function clearAuthToken(): void {
  authToken = null;
  authProvider = null;
}

export function setPendingAuthProvider(provider: string): void {
  sessionStorage.setItem(PENDING_PROVIDER_KEY, provider);
}

export function takePendingAuthProvider(): string | null {
  const provider = sessionStorage.getItem(PENDING_PROVIDER_KEY);
  sessionStorage.removeItem(PENDING_PROVIDER_KEY);
  return provider;
}

export function setPendingLinkProvider(provider: string): void {
  sessionStorage.setItem(PENDING_LINK_PROVIDER_KEY, provider);
}

export function takePendingLinkProvider(): string | null {
  const provider = sessionStorage.getItem(PENDING_LINK_PROVIDER_KEY);
  sessionStorage.removeItem(PENDING_LINK_PROVIDER_KEY);
  return provider;
}
