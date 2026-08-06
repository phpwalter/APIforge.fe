import { useEffect, useState, type ReactNode } from 'react';
import { fetchMe } from '../../lib/api/auth';
import { clearAuthToken, getAuthProvider, getAuthToken } from '../../lib/api/authToken';
import {
  installProjectSessionPersistence,
  projectSessionAccountKey,
  restoreProjectSession,
} from '../../lib/project-session/projectSession';
import { useAppStore } from '../../state/useAppStore';
import { restoreServerProject } from '../../lib/project-server/projectServer';
import type { UserProfile } from '../../types/ui';

type AuthBootstrapProps = {
  children: ReactNode;
};

type AuthenticatedUserResponse = {
  name?: string;
  display_name?: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  last_login_at?: string;
  use_gravatar?: boolean;
  gravatar_email?: string;
  record_version?: number;
  roles?: unknown;
  company_id?: string | null;
  company_name?: string | null;
  company_slug?: string | null;
  plan_code?: string | null;
};

type RestoredSession = {
  authenticated: boolean;
  profile: UserProfile | null;
};

let restorationPromise: Promise<RestoredSession> | null = null;

function profileFrom(me: AuthenticatedUserResponse): UserProfile {
  return {
    name: me.name ?? me.display_name ?? me.username ?? me.email ?? 'Signed in user',
    email: me.email ?? '',
    avatarUrl: me.avatar_url || undefined,
    bio: me.bio || undefined,
    memberSince: me.created_at || undefined,
    lastLoginAt: me.last_login_at || undefined,
    useGravatar: me.use_gravatar ?? false,
    gravatarEmail: me.gravatar_email || undefined,
    recordVersion: me.record_version,
    roles: Array.isArray(me.roles)
      ? me.roles.filter((role): role is string => typeof role === 'string')
      : [],
    companyId: me.company_id || undefined,
    companyName: me.company_name || undefined,
    companySlug: me.company_slug || undefined,
    planCode: me.plan_code || undefined,
  };
}

async function restoreSession(): Promise<RestoredSession> {
  const token = getAuthToken();
  if (!token) return { authenticated: false, profile: null };

  try {
    const me = (await fetchMe()) as AuthenticatedUserResponse;
    if (!Number.isInteger(me.record_version) || (me.record_version ?? 0) < 1) {
      throw new Error('The authenticated-user response did not include a valid record_version.');
    }

    const profile = profileFrom(me);
    useAppStore.getState().hydrateSession(profile, getAuthProvider() ?? 'oauth');
    return { authenticated: true, profile };
  } catch (error: unknown) {
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? Number((error as { status?: unknown }).status)
        : null;

    if (status === 401) {
      clearAuthToken();
      useAppStore.setState({ signedIn: false });
      return { authenticated: false, profile: null };
    }

    throw error;
  }
}

function restoreOnce(): Promise<RestoredSession> {
  restorationPromise ??= restoreSession().finally(() => {
    restorationPromise = null;
  });
  return restorationPromise;
}

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    let activeAccountKey: string | null = null;
    let uninstallProjectPersistence: (() => void) | null = null;

    const synchronizeProjectSession = (): void => {
      const state = useAppStore.getState();

      if (!state.signedIn || !state.userProfile.email) {
        uninstallProjectPersistence?.();
        uninstallProjectPersistence = null;
        activeAccountKey = null;
        return;
      }

      const accountKey = projectSessionAccountKey(state.userProfile);
      if (accountKey === activeAccountKey) return;

      uninstallProjectPersistence?.();
      uninstallProjectPersistence = null;
      activeAccountKey = accountKey;

      // This runs for both startup restoration and a new OAuth sign-in that occurs after
      // AuthBootstrap has already mounted. The previous implementation only installed project
      // persistence during startup, so projects opened after a fresh sign-in were never saved.
      restoreProjectSession(state.userProfile);
      void restoreServerProject(accountKey).catch((error: unknown) => {
        console.error('APIForge server project restoration failed.', error);
      });
      uninstallProjectPersistence = installProjectSessionPersistence(state.userProfile);
    };

    const unsubscribeAuth = useAppStore.subscribe(
      (state) => ({
        signedIn: state.signedIn,
        userProfile: state.userProfile,
      }),
      synchronizeProjectSession,
      { fireImmediately: true },
    );

    restoreOnce()
      .then(({ authenticated }) => {
        if (!active) return;
        if (!authenticated) useAppStore.setState({ signedIn: false });
        synchronizeProjectSession();
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error('APIForge session restoration failed.', error);
        useAppStore.setState({ signedIn: false });
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
      unsubscribeAuth();
      uninstallProjectPersistence?.();
    };
  }, []);

  return ready ? children : null;
}
