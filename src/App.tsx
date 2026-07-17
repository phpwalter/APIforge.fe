import { useEffect, useRef } from 'react';
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

function profileFrom(me: {
  name?: string;
  display_name?: string;
  username?: string;
  email?: string;
  avatar_url?: string;
}): UserProfile {
  const name = me.name ?? me.display_name ?? me.username ?? me.email ?? 'Signed in user';
  return { name, email: me.email ?? '', avatarUrl: me.avatar_url || undefined };
}

function App() {
  const signedIn = useAppStore((s) => s.signedIn);
  const hydrateSession = useAppStore((s) => s.hydrateSession);
  const connectVersionControlProvider = useAppStore((s) => s.connectVersionControlProvider);
  // StrictMode runs this effect twice in dev. Without this guard, the second run would find the
  // auth_session param already stripped by the first, fall through to the "verify stored token"
  // branch, and overwrite the rich profile we just hydrated with whatever thinner shape /auth/me
  // happens to return.
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

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
      // record its identity instead of touching signedIn/userProfile/authProvider.
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
          .catch(() => {});
        return;
      }

      const provider = takePendingAuthProvider() ?? 'google';
      setAuthToken(session.token.access_token);
      setAuthProvider(provider);
      hydrateSession(profileFrom(session.user ?? {}), provider);
      return;
    }

    // Otherwise, a token from an earlier visit may still be valid — verify it against the server
    // rather than trusting whatever profile was last cached, since it may be stale or revoked.
    const token = getAuthToken();
    const provider = getAuthProvider();
    if (!token || !provider) return;
    fetchMe()
      .then((me: MeResponse) => hydrateSession(profileFrom(me), provider))
      .catch(() => clearAuthToken());
  }, [hydrateSession, connectVersionControlProvider]);

  return signedIn ? <AppShell /> : <LandingPage />;
}

export default App;
