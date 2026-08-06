import { clearAuthSession, readAuthSession } from "./authSession";
import { fetchAuthenticatedProfile, type AuthenticatedProfile } from "./authProfile";
import { ApiRequestError, AuthenticationRequiredError } from "./authenticatedApi";

export type SessionRestorationResult =
  | { status: "anonymous" }
  | { status: "authenticated"; profile: AuthenticatedProfile }
  | { status: "unavailable"; error: Error };

export async function restoreAuthSession(signal?: AbortSignal): Promise<SessionRestorationResult> {
  if (!readAuthSession()) return { status: "anonymous" };

  try {
    const profile = await fetchAuthenticatedProfile(signal);
    return { status: "authenticated", profile };
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      clearAuthSession();
      return { status: "anonymous" };
    }

    if (error instanceof DOMException && error.name === "AbortError") throw error;

    if (error instanceof ApiRequestError || error instanceof Error) {
      return { status: "unavailable", error };
    }

    return { status: "unavailable", error: new Error("Session restoration failed.") };
  }
}
