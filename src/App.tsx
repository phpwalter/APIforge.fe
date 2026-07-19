import { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useAppStore } from './state/useAppStore';
import { AppShell } from './components/Shell/AppShell';
import { LandingPage } from './components/Landing/LandingPage';
import { fetchMe, linkProvider, readAuthSessionFromLocation, type MeResponse } from './lib/api/auth';
import {
  getAuthProvider,
  getAuthToken,
  setAuthProvider,
  setAuthToken,
  clearAuthToken,
  takePendingAuthProvider,
  takePendingLinkProvider,
} from './lib/api/authToken';
import type { UserProfile } from './types/ui';
import styles from './App.module.css';

function profileFrom(me: {
  name?: string;
  display_name?: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  last_login_at?: string;
}): UserProfile {
  const name = me.name ?? me.display_name ?? me.username ?? me.email ?? 'Signed in user';
  return {
    name,
    email: me.email ?? '',
    avatarUrl: me.avatar_url || undefined,
    bio: me.bio || undefined,
    memberSince: me.created_at || undefined,
    lastLoginAt: me.last_login_at || undefined,
  };
}

/**
 * True whenever the very first render might resolve into a signed-in session — either we've just
 * landed back from an OAuth redirect (auth_session in the URL), or an earlier visit left a token
 * behind to verify. In either case we hold off rendering LandingPage vs AppShell until that
 * resolves, so a returning session never flashes the landing page before flipping to the app.
 */
function hasPendingAuth(): boolean {
  return window.location.search.includes('auth_session=') || (!!getAuthToken() && !!getAuthProvider());
}

function App() {
  const signedIn = useAppStore((s) => s.signedIn);
  const theme = useAppStore((s) => s.theme);
  const hydrateSession = useAppStore((s) => s.hydrateSession);
  const connectVersionControlProvider = useAppStore((s) => s.connectVersionControlProvider);
  const [resolving, setResolving] = useState(hasPendingAuth);
  // StrictMode runs this effect twice in dev. Without this guard, the second run would find the
  // auth_session param already stripped by the first, fall through to the "verify stored token"
  // branch, and overwrite the rich profile we just hydrated with whatever thinner shape /auth/me
  // happens to return.
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    // Verifies (or clears) whatever token is left in localStorage — the fallback for every path
    // below that isn't a fresh sign-in itself: no auth_session at all, or a "link" redirect, which
    // proves ownership of a second account but was never the primary session to begin with.
    const restoreStoredSession = () => {
      const token = getAuthToken();
      const provider = getAuthProvider();
      if (!token || !provider) {
        setResolving(false);
        return;
      }
      fetchMe()
        .then((me: MeResponse) => hydrateSession(profileFrom(me), provider))
        .catch(() => clearAuthToken())
        .finally(() => setResolving(false));
    };

    // Back from a completed OAuth round trip — the backend hands the session back via a base64
    // query param rather than a cookie (this API is bearer-token only). The payload itself
    // doesn't say which provider produced it, so fall back on what we recorded before redirecting.
    const session = readAuthSessionFromLocation(window.location.search);
    if (session?.token?.access_token) {
      const params = new URLSearchParams(window.location.search);
      params.delete('auth_session');
      const query = params.toString();
      window.history.replaceState(
        {},
        '',
        window.location.pathname + (query ? `?${query}` : '') + window.location.hash,
      );

      // A "link" redirect (Settings :: Version Control) proves ownership of the linked account via
      // real OAuth, but must not replace the active session — register the link server-side and
      // record its identity instead of touching signedIn/userProfile/authProvider. The primary
      // session still needs restoring from the stored token afterward, same as if there'd been no
      // auth_session at all — this redirect was never a sign-in.
      const linkProviderId = takePendingLinkProvider();
      if (linkProviderId === 'github') {
        const user = session.user ?? {};
        linkProvider(linkProviderId)
          .then(() =>
            connectVersionControlProvider(linkProviderId, {
              username: user.username ?? user.display_name ?? user.email,
              avatarUrl: user.avatar_url,
            }),
          )
          .catch(() => {})
          .finally(restoreStoredSession);
        return;
      }

      const provider = takePendingAuthProvider() ?? 'google';
      setAuthToken(session.token.access_token);
      setAuthProvider(provider);
      hydrateSession(profileFrom(session.user ?? {}), provider);
      setResolving(false);
      return;
    }

    // Otherwise, a token from an earlier visit may still be valid — verify it against the server
    // rather than trusting whatever profile was last cached, since it may be stale or revoked.
    restoreStoredSession();
  }, [hydrateSession, connectVersionControlProvider]);

  if (resolving) {
    return (
      <div className={`app ${styles.splash}`} data-theme={theme}>
        <LoaderCircle size={22} className={styles.spin} />
      </div>
    );
  }

  return signedIn ? <AppShell /> : <LandingPage />;
}

export default App;
