const AUTH_TOKEN_KEY = 'apiforge.auth.token';
const AUTH_PROVIDER_KEY = 'apiforge.auth.provider';
const AUTH_EXPIRED_KEY = 'apiforge.auth.expired';
const PENDING_AUTH_PROVIDER_KEY = 'apiforge.auth.pending-provider';
const PENDING_LINK_PROVIDER_KEY = 'apiforge.auth.pending-link-provider';

export const SESSION_EXPIRED_EVENT = 'apiforge:session-expired';

let memoryToken: string | null = null;
let memoryProvider: string | null = null;

function storage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function read(key: string): string | null {
  const value = storage()?.getItem(key) ?? null;
  return value && value.trim() !== '' ? value : null;
}

function write(key: string, value: string | null): void {
  const target = storage();
  if (!target) {
    return;
  }

  if (value === null || value.trim() === '') {
    target.removeItem(key);
    return;
  }

  target.setItem(key, value);
}

export function getAuthToken(): string | null {
  if (memoryToken !== null) {
    return memoryToken;
  }

  memoryToken = read(AUTH_TOKEN_KEY);
  return memoryToken;
}

export function setAuthToken(token: string): void {
  const normalized = token.trim();
  memoryToken = normalized === '' ? null : normalized;
  write(AUTH_TOKEN_KEY, memoryToken);
  if (memoryToken) clearAuthExpired();
}

export function getAuthProvider(): string | null {
  if (memoryProvider !== null) {
    return memoryProvider;
  }

  memoryProvider = read(AUTH_PROVIDER_KEY);
  return memoryProvider;
}

export function setAuthProvider(provider: string): void {
  const normalized = provider.trim().toLowerCase();
  memoryProvider = normalized === '' ? null : normalized;
  write(AUTH_PROVIDER_KEY, memoryProvider);
}

export function clearAuthToken(): void {
  memoryToken = null;
  memoryProvider = null;
  write(AUTH_TOKEN_KEY, null);
  write(AUTH_PROVIDER_KEY, null);
}

/**
 * Marks an expired/invalid authenticated session without clearing the active project.
 * The marker survives the OAuth redirect so the sign-in UI can explain why it opened.
 */
export function markAuthExpired(): void {
  write(AUTH_EXPIRED_KEY, '1');
}

export function isAuthExpired(): boolean {
  return read(AUTH_EXPIRED_KEY) === '1';
}

export function clearAuthExpired(): void {
  write(AUTH_EXPIRED_KEY, null);
}

export function setPendingAuthProvider(provider: string): void {
  write(PENDING_AUTH_PROVIDER_KEY, provider.trim().toLowerCase());
}

export function takePendingAuthProvider(): string | null {
  return take(PENDING_AUTH_PROVIDER_KEY);
}

export function setPendingLinkProvider(provider: string): void {
  write(PENDING_LINK_PROVIDER_KEY, provider.trim().toLowerCase());
}

export function takePendingLinkProvider(): string | null {
  return take(PENDING_LINK_PROVIDER_KEY);
}

function take(key: string): string | null {
  const value = read(key);
  write(key, null);
  return value;
}
