import { useCallback, useEffect, useState } from 'react';
import { Layers, LoaderCircle, RotateCw, X } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { redirectToProviderSignIn } from '../../lib/api/auth';
import { loadAuthProviders, retryAuthProviders, type AuthProvider } from './providers';
import { ProviderIcon } from './ProviderIcon';
import styles from './AuthModal.module.css';

export function AuthModal() {
  const closeAuth = useAppStore((s) => s.closeAuth);
  const [providers, setProviders] = useState<AuthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [redirectingTo, setRedirectingTo] = useState<string | null>(null);

  const loadProviders = useCallback(async (retry = false) => {
    setLoading(true);
    setLoadError(false);
    try {
      setProviders(await (retry ? retryAuthProviders() : loadAuthProviders()));
    } catch {
      setProviders([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAuth();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeAuth]);

  const signInWith = (provider: AuthProvider) => {
    setRedirectingTo(provider.code);
    redirectToProviderSignIn(provider.code, provider.signin_endpoint);
  };

  return (
    <div className={styles.scrim} data-redirecting={redirectingTo !== null} onClick={closeAuth}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
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

        {loading && (
          <div className={styles.providerState} aria-live="polite">
            <LoaderCircle size={20} className={styles.spin} />
            <span>Loading sign-in providers…</span>
          </div>
        )}

        {!loading && loadError && (
          <div className={styles.providerState} role="alert">
            <span>Sign-in providers could not be loaded.</span>
            <button type="button" className={styles.retryBtn} onClick={() => void loadProviders(true)}>
              <RotateCw size={14} />
              Retry
            </button>
          </div>
        )}

        {!loading && !loadError && providers.length === 0 && (
          <div className={styles.providerState} aria-live="polite">
            No sign-in providers are currently available.
          </div>
        )}

        {!loading && !loadError && providers.length > 0 && (
          <div className={styles.grid}>
            {providers.map((provider) => (
              <button
                key={provider.code}
                type="button"
                className={styles.providerBtn}
                disabled={redirectingTo !== null}
                onClick={() => signInWith(provider)}
              >
                {redirectingTo === provider.code ? (
                  <LoaderCircle size={20} className={`${styles.providerIcon} ${styles.spin}`} />
                ) : (
                  <ProviderIcon id={provider.code} className={styles.providerIcon} />
                )}
                {provider.display_name}
              </button>
            ))}
          </div>
        )}

        <p className={styles.legal}>
          By signing in, you agree to our{' '}
          <button type="button" className={styles.legalLink}>Terms of Service</button>{' '}
          and{' '}
          <button type="button" className={styles.legalLink}>Privacy Policy</button>.
        </p>
      </div>
    </div>
  );
}
