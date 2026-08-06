import { create } from "zustand";
import { getGravatar } from "../lib/auth";
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
    const avatarSrc = email ? getGravatar(email, avatarUrl) : avatarUrl;
    set({ profileName: name, profileEmail: email, avatarSrc });
  },

  setSession: (session) => {
    writeAuthSession(session);
    set({ session, status: "unknown", isAuthenticated: false, restorationError: null });
  },

  beginRestoration: () => set({ status: "restoring", isAuthenticated: false, restorationError: null }),

  hydrateAuthenticatedProfile: (profile) => {
    const avatarSrc = profile.email ? getGravatar(profile.email, profile.avatarUrl) : profile.avatarUrl;
    set({
      status: "authenticated",
      isAuthenticated: true,
      profileName: profile.displayName,
      profileEmail: profile.email,
      avatarSrc,
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
