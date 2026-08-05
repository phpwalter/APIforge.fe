export type AuthSession = {
  accessToken: string;
  expiresAt?: string;
  provider?: string;
};

const STORAGE_KEY = "apiforge.auth.session.v1";

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AuthSession>;
  return typeof candidate.accessToken === "string" && candidate.accessToken.length > 0;
}

export function readAuthSession(): AuthSession | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession): void {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function getAccessToken(): string | null {
  return readAuthSession()?.accessToken ?? null;
}
