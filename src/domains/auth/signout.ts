import { clearAuthSession, getAccessToken } from "./authSession";

const API_SERVER = (import.meta.env.VITE_API_SERVER ?? "http://localhost:8080").replace(/\/$/, "");

export class SignoutError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "SignoutError";
  }
}

export async function signOut(signal?: AbortSignal): Promise<void> {
  const accessToken = getAccessToken();

  try {
    if (accessToken) {
      const response = await fetch(`${API_SERVER}/auth/signout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-API-Version": "v1",
        },
        credentials: "include",
        signal,
      });

      // A stale/expired/revoked token already represents a signed-out server
      // state. Treat 401 as successful local termination.
      if (!response.ok && response.status !== 401) {
        throw new SignoutError(`Sign-out failed with HTTP ${response.status}.`, response.status);
      }
    }
  } finally {
    clearAuthSession();
    clearAccountScopedStorage();
  }
}

function clearAccountScopedStorage(): void {
  const prefixes = ["apiforge.user.", "apiforge.workspace.", "apiforge.project.", "apiforge.oauth."];

  for (const storage of [window.localStorage, window.sessionStorage]) {
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) keys.push(key);
    }
    for (const key of keys) storage.removeItem(key);
  }
}
