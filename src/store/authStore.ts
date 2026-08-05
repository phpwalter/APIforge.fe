import { create } from "zustand";
import { getGravatar } from "../lib/auth";
import { readAuthSession, writeAuthSession, type AuthSession } from "../domains/auth/authSession";

interface AuthState {
  isAuthenticated: boolean;
  profileName: string;
  avatarSrc: string | undefined;
  session: AuthSession | null;
  setIsAuthenticated: (status: boolean) => void;
  setProfile: (name: string, email?: string, avatarUrl?: string) => void;
  setSession: (session: AuthSession) => void;
  logout: () => void;
}

const initialSession = typeof window === "undefined" ? null : readAuthSession();

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: initialSession !== null,
  profileName: "User",
  avatarSrc: undefined,
  session: initialSession,

  setIsAuthenticated: (status) => set({ isAuthenticated: status }),
  setProfile: (name, email, avatarUrl) => {
    const avatarSrc = email ? getGravatar(email, avatarUrl) : avatarUrl;
    set({ profileName: name, avatarSrc });
  },
  setSession: (session) => {
    writeAuthSession(session);
    set({ session, isAuthenticated: true });
  },
  logout: () =>
    set({
      isAuthenticated: false,
      profileName: "User",
      avatarSrc: undefined,
      session: null,
    }),
}));
