const AUTH_TOKEN_KEY = 'apiforge.auth.token';
const AUTH_TOKEN_EXPIRES_AT_KEY = 'apiforge.auth.token-expires-at';
const AUTH_PROVIDER_KEY = 'apiforge.auth.provider';
const PENDING_AUTH_PROVIDER_KEY = 'apiforge.auth.pending-provider';
const PENDING_LINK_PROVIDER_KEY = 'apiforge.auth.pending-link-provider';

let memoryToken: string | null = null;
let memoryExpiresAt: number | null = null;
let memoryProvider: string | null = null;

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
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
  if (!target) return;
  if (value === null || value.trim() === '') {
    target.removeItem(key);
    return;
  }
  target.setItem(key, value);
}

function jwtExpiryMs(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof payload.exp === 'number' && Number.isFinite(payload.exp) ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  if (memoryToken !== null) return memoryToken;
  memoryToken = read(AUTH_TOKEN_KEY);
  return memoryToken;
}

export function getAuthTokenExpiresAt(): number | null {
  if (memoryExpiresAt !== null) return memoryExpiresAt;
  const stored = read(AUTH_TOKEN_EXPIRES_AT_KEY);
  if (stored) {
    const value = Number(stored);
    if (Number.isFinite(value) && value > 0) {
      memoryExpiresAt = value;
      return value;
    }
  }

  const token = getAuthToken();
  memoryExpiresAt = token ? jwtExpiryMs(token) : null;
  return memoryExpiresAt;
}

export function setAuthToken(token: string, expiresInSeconds?: number): void {
  const normalized = token.trim();
  memoryToken = normalized === '' ? null : normalized;
  write(AUTH_TOKEN_KEY, memoryToken);

  const expiresAt = memoryToken
    ? Number.isFinite(expiresInSeconds) && (expiresInSeconds ?? 0) > 0
      ? Date.now() + Number(expiresInSeconds) * 1000
      : jwtExpiryMs(memoryToken)
    : null;
  memoryExpiresAt = expiresAt;
  write(AUTH_TOKEN_EXPIRES_AT_KEY, expiresAt === null ? null : String(expiresAt));
}

export function clearAccessToken(): void {
  memoryToken = null;
  memoryExpiresAt = null;
  write(AUTH_TOKEN_KEY, null);
  write(AUTH_TOKEN_EXPIRES_AT_KEY, null);
}

export function getAuthProvider(): string | null {
  if (memoryProvider !== null) return memoryProvider;
  memoryProvider = read(AUTH_PROVIDER_KEY);
  return memoryProvider;
}

export function setAuthProvider(provider: string): void {
  const normalized = provider.trim().toLowerCase();
  memoryProvider = normalized === '' ? null : normalized;
  write(AUTH_PROVIDER_KEY, memoryProvider);
}

export function clearAuthToken(): void {
  clearAccessToken();
  memoryProvider = null;
  write(AUTH_PROVIDER_KEY, null);
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
