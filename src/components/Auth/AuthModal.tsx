import { useEffect } from 'react';
import { Layers, X } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { PROVIDERS } from './providers';
import { ProviderIcon } from './ProviderIcon';
import styles from './AuthModal.module.css';

export function AuthModal() {
  const closeAuth = useAppStore((s) => s.closeAuth);
  const signIn = useAppStore((s) => s.signIn);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuth();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeAuth]);

  // No username/password flow — every provider button completes sign-in.
  // Swap this for a real OAuth redirect per provider when the backend exists.
  const signInWith = (_providerId: string) => signIn();

  return (
    <div className={styles.scrim} onClick={closeAuth}>
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
              onClick={() => signInWith(provider.id)}
            >
              <ProviderIcon id={provider.id} src={provider.icon} className={styles.providerIcon} />
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
