import { Check } from 'lucide-react';
import { useAppStore } from '../../../state/useAppStore';
import { redirectToProviderLink } from '../../api/auth';
import { GitHubIcon, GitLabIcon, BitbucketIcon, type IconComponent } from '../../../components/Auth/ProviderIcons';
import styles from './VersionControlSettingsPanel.module.css';

interface ProviderRow {
  id: 'github' | 'gitlab' | 'bitbucket';
  label: string;
  description: string;
  icon: IconComponent;
  /** The backend only has an OAuth callback for github today — gitlab/bitbucket stay UI-only stubs. */
  live: boolean;
}

const PROVIDER_ROWS: ProviderRow[] = [
  {
    id: 'github',
    label: 'GitHub',
    description: 'Connect your GitHub account via OAuth to link it to your APIforge account.',
    icon: GitHubIcon,
    live: true,
  },
  {
    id: 'gitlab',
    label: 'GitLab',
    description: 'Connect your GitLab account via OAuth.',
    icon: GitLabIcon,
    live: false,
  },
  {
    id: 'bitbucket',
    label: 'Bitbucket',
    description: 'Connect your Bitbucket account via OAuth.',
    icon: BitbucketIcon,
    live: false,
  },
];

export function VersionControlSettingsPanel() {
  const authProvider = useAppStore((s) => s.authProvider);
  const versionControlLinks = useAppStore((s) => s.versionControlLinks);
  const disconnectVersionControlProvider = useAppStore((s) => s.disconnectVersionControlProvider);

  return (
    <>
      <div>
        <div className={styles.title}>Version Control</div>
        <div className={styles.description}>
          Connect a Git hosting provider using its own OAuth sign-in — APIforge never sees your provider password.
        </div>
      </div>

      <div className={styles.providerList}>
        {PROVIDER_ROWS.map((row) => {
          const Icon = row.icon;
          const isPrimarySignIn = row.live && authProvider === row.id;
          const link = row.live ? versionControlLinks[row.id] : undefined;
          const connected = isPrimarySignIn || link != null;

          return (
            <div key={row.id} className={styles.providerRow} data-disabled={!row.live}>
              <span className={styles.providerIcon}>
                <Icon size={28} />
              </span>
              <div className={styles.providerBody}>
                <div className={styles.providerLabelRow}>
                  <span className={styles.providerLabel}>{row.label}</span>
                  {!row.live && <span className={styles.comingSoonPill}>Coming Soon</span>}
                  {connected && (
                    <span className={styles.connectedPill}>
                      <Check size={11} />
                      Connected{link?.username ? ` as ${link.username}` : isPrimarySignIn ? ' · Primary sign-in' : ''}
                    </span>
                  )}
                </div>
                <div className={styles.providerDesc}>{row.description}</div>
              </div>

              {row.live ? (
                connected ? (
                  !isPrimarySignIn && (
                    <button
                      type="button"
                      className={styles.disconnectBtn}
                      onClick={() => disconnectVersionControlProvider(row.id)}
                    >
                      Disconnect
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    className={styles.connectBtn}
                    onClick={() => redirectToProviderLink(row.id)}
                  >
                    Connect with {row.label}
                  </button>
                )
              ) : (
                <button type="button" className={styles.connectBtn} disabled title="Coming soon">
                  Connect with {row.label}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
