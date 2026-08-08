import { create } from "zustand";
import { gravatarUrl } from "../lib/gravatar";
import { clearAuthSession, readAuthSession, writeAuthSession, type AuthSession } from "../domains/auth/authSession";
import type { AuthenticatedProfile } from "../domains/auth/authProfile";

export type AuthStatus = "unknown" | "restoring" | "authenticated" | "anonymous" | "unavailable";

interface AuthState {
  status: AuthStatus;
  isAuthenticated: boolean;
  profileName: string;
  profileEmail: string | undefined;
  avatarSrc: string | undefined;
  companyId: string | undefined;
  companyName: string | undefined;
  roles: string[];
  session: AuthSession | null;
  restorationError: string | null;
  setIsAuthenticated: (status: boolean) => void;
  setProfile: (name: string, email?: string, avatarUrl?: string) => void;
  setSession: (session: AuthSession) => void;
  beginRestoration: () => void;
  hydrateAuthenticatedProfile: (profile: AuthenticatedProfile) => void;
  markAnonymous: () => void;
  markUnavailable: (error: Error) => void;
  logout: () => void;
}

const initialSession = typeof window === "undefined" ? null : readAuthSession();

function resolveAvatar(email: string | undefined, avatarUrl: string | undefined): string | undefined {
  const provided = avatarUrl?.trim();
  if (provided) return provided;
  return email ? gravatarUrl(email) : undefined;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: initialSession ? "unknown" : "anonymous",
  isAuthenticated: false,
  profileName: "User",
  profileEmail: undefined,
  avatarSrc: undefined,
  companyId: undefined,
  companyName: undefined,
  roles: [],
  session: initialSession,
  restorationError: null,

  setIsAuthenticated: (authenticated) =>
    set({
      isAuthenticated: authenticated,
      status: authenticated ? "authenticated" : "anonymous",
      restorationError: null,
    }),

  setProfile: (name, email, avatarUrl) => {
    set({ profileName: name, profileEmail: email, avatarSrc: resolveAvatar(email, avatarUrl) });
  },

  setSession: (session) => {
    writeAuthSession(session);
    set({ session, status: "unknown", isAuthenticated: false, restorationError: null });
  },

  beginRestoration: () => set({ status: "restoring", isAuthenticated: false, restorationError: null }),

  hydrateAuthenticatedProfile: (profile) => {
    set({
      status: "authenticated",
      isAuthenticated: true,
      profileName: profile.displayName,
      profileEmail: profile.email,
      avatarSrc: resolveAvatar(profile.email, profile.avatarUrl),
      companyId: profile.companyId,
      companyName: profile.companyName,
      roles: profile.roles,
      restorationError: null,
    });
  },

  markAnonymous: () => {
    clearAuthSession();
    set(anonymousState());
  },

  markUnavailable: (error) =>
    set({
      status: "unavailable",
      isAuthenticated: false,
      restorationError: error.message,
    }),

  logout: () => {
    clearAuthSession();
    set(anonymousState());
  },
}));

function anonymousState(): Pick<
  AuthState,
  | "status"
  | "isAuthenticated"
  | "profileName"
  | "profileEmail"
  | "avatarSrc"
  | "companyId"
  | "companyName"
  | "roles"
  | "session"
  | "restorationError"
> {
  return {
    status: "anonymous",
    isAuthenticated: false,
    profileName: "User",
    profileEmail: undefined,
    avatarSrc: undefined,
    companyId: undefined,
    companyName: undefined,
    roles: [],
    session: null,
    restorationError: null,
  };
}
