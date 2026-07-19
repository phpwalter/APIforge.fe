import { useEffect, useState } from 'react';
import { Layers, LoaderCircle, X } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { redirectToProviderSignIn } from '../../lib/api/auth';
import { PROVIDERS } from './providers';
import { ProviderIcon } from './ProviderIcon';
import styles from './AuthModal.module.css';

/** Providers with a real backend OAuth round trip — everything else stays a demo instant sign-in. */
const LIVE_PROVIDERS = new Set(['google', 'github']);

export function AuthModal() {
  const closeAuth = useAppStore((s) => s.closeAuth);
  const signIn = useAppStore((s) => s.signIn);
  // Set right before the full-page redirect fires — there's a brief gap between that and the
  // browser actually leaving this page, which otherwise looks like the button did nothing.
  const [redirectingTo, setRedirectingTo] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuth();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeAuth]);

  // LIVE_PROVIDERS leave the SPA entirely for a real OAuth redirect through the backend. The rest
  // have no backend integration yet, so they still complete sign-in instantly for demo purposes.
  const signInWith = (providerId: string) => {
    if (!LIVE_PROVIDERS.has(providerId)) {
      signIn();
      return;
    }
    setRedirectingTo(providerId);
    redirectToProviderSignIn(providerId);
  };

  return (
    <div className={styles.scrim} data-redirecting={redirectingTo !== null} onClick={closeAuth}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className={styles.closeBtn} onClick={closeAuth} aria-label="Close">
          <X size={16} />
        </button>

        <div className={styles.icon}>
          <Layers size={28} />
        </div>

        <h2 className={styles.title}>Welcome to APIforge</h2>
        <p className={styles.subtitle}>Simplify your API modeling. Create, build, and deploy capabilities.</p>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerLabel}>LOG IN VIA</span>
          <span className={styles.dividerLine} />
        </div>

        <div className={styles.grid}>
          {PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              type="button"
              className={styles.providerBtn}
              disabled={redirectingTo !== null}
              onClick={() => signInWith(provider.id)}
            >
              {redirectingTo === provider.id ? (
                <LoaderCircle size={20} className={`${styles.providerIcon} ${styles.spin}`} />
              ) : (
                <ProviderIcon id={provider.id} src={provider.icon} className={styles.providerIcon} />
              )}
              {provider.label}
            </button>
          ))}
        </div>

        <p className={styles.legal}>
          By signing in, you agree to our{' '}
          <button type="button" className={styles.legalLink}>
            Terms of Service
          </button>{' '}
          and{' '}
          <button type="button" className={styles.legalLink}>
            Privacy Policy
          </button>
          .
        </p>
      </div>
    </div>
  );
}
