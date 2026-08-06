export type AuthSession = {
  accessToken: string;
  expiresAt?: string;
  provider?: string;
};

const STORAGE_KEY = "apiforge.auth.session.v1";

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<AuthSession>;
  if (typeof candidate.accessToken !== "string" || candidate.accessToken.trim() === "") {
    return false;
  }

  if (candidate.expiresAt !== undefined && typeof candidate.expiresAt !== "string") {
    return false;
  }

  if (candidate.provider !== undefined && typeof candidate.provider !== "string") {
    return false;
  }

  return true;
}

export function readAuthSession(): AuthSession | null {
  const target = storage();
  if (!target) return null;

  try {
    const raw = target.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isAuthSession(parsed)) {
      target.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    target.removeItem(STORAGE_KEY);
    return null;
  }
}

export function writeAuthSession(session: AuthSession): void {
  const target = storage();
  if (!target) return;
  target.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  storage()?.removeItem(STORAGE_KEY);
}

export function getAccessToken(): string | null {
  return readAuthSession()?.accessToken ?? null;
}

export function hasStoredAuthSession(): boolean {
  return readAuthSession() !== null;
}
