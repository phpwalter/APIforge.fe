import { useEffect, useRef, useState } from 'react';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { exchangeAuthorizationCode, readOAuthCallbackFromLocation } from '../../lib/api/auth';
import {
  clearAuthToken,
  setAuthProvider,
  setAuthToken,
  takePendingAuthProvider,
  takePendingLinkProvider,
} from '../../lib/api/authToken';
import { useAppStore } from '../../state/useAppStore';
import type { UserProfile } from '../../types/ui';
import styles from './OAuthCallbackPage.module.css';

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
  return {
    name: me.name ?? me.display_name ?? me.username ?? me.email ?? 'Signed in user',
    email: me.email ?? '',
    avatarUrl: me.avatar_url || undefined,
    bio: me.bio || undefined,
    memberSince: me.created_at || undefined,
    lastLoginAt: me.last_login_at || undefined,
  };
}

function cleanCallbackUrl(): void {
  window.history.replaceState({}, '', '/oauth/callback');
}

export function OAuthCallbackPage() {
  const theme = useAppStore((state) => state.theme);
  const hydrateSession = useAppStore((state) => state.hydrateSession);
  const connectVersionControlProvider = useAppStore((state) => state.connectVersionControlProvider);
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const callback = readOAuthCallbackFromLocation(window.location.search);
    const linkProvider = takePendingLinkProvider();
    const pendingProvider = takePendingAuthProvider();
    const expectedProvider = linkProvider ?? pendingProvider;
    const provider = callback.provider ?? expectedProvider;

    cleanCallbackUrl();

    if (callback.provider && expectedProvider && callback.provider !== expectedProvider) {
      clearAuthToken();
      setError('The OAuth callback provider does not match the sign-in request. Please begin sign-in again.');
      return;
    }

    if (!callback.code || !provider) {
      clearAuthToken();
      setError('The OAuth callback is missing its one-time code or provider. Please begin sign-in again.');
      return;
    }

    exchangeAuthorizationCode(callback.code, provider)
      .then((session) => {
        const accessToken = session.token?.access_token;
        if (!accessToken) {
          throw new Error('The authorization exchange returned no access token.');
        }

        setAuthToken(accessToken);
        setAuthProvider(provider);
        window.history.replaceState({}, '', '/');
        hydrateSession(profileFrom(session.user ?? {}), provider);

        if (
          linkProvider &&
          (linkProvider === 'github' || linkProvider === 'gitlab' || linkProvider === 'bitbucket')
        ) {
          const linked = session.linked_profile;
          connectVersionControlProvider(linkProvider, {
            username: linked?.username ?? linked?.display_name,
            avatarUrl: linked?.avatar_url,
          });
        }

      })
      .catch((reason: unknown) => {
        clearAuthToken();
        setError(reason instanceof Error ? reason.message : 'APIForge could not complete sign-in.');
      });
  }, [connectVersionControlProvider, hydrateSession]);

  return (
    <main className={styles.page} data-theme={theme}>
      <section className={styles.card} aria-live="polite">
        {error ? (
          <>
            <AlertCircle size={28} className={styles.errorIcon} aria-hidden="true" />
            <h1>Sign-in failed</h1>
            <p>{error}</p>
            <a className={styles.action} href="/">Return to sign in</a>
          </>
        ) : (
          <>
            <LoaderCircle size={28} className={styles.spinner} aria-hidden="true" />
            <h1>Completing sign-in</h1>
            <p>Please remain on this page while APIForge completes authentication.</p>
          </>
        )}
      </section>
    </main>
  );
}
