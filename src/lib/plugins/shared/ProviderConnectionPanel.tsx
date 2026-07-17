import { Check } from 'lucide-react';
import styles from './ProviderConnectionPanel.module.css';

interface ProviderConnectionPanelProps {
  title: string;
  description: string;
  providerLabel: string;
  connected: boolean;
  connectedLabel?: string;
  /** Omit when not connectable yet (e.g. a stub provider with no backend OAuth callback) — renders a disabled button. */
  onConnect?: () => void;
  /** Omit to hide the Disconnect action (e.g. the connection is your primary sign-in, or there's nothing to disconnect). */
  onDisconnect?: () => void;
}

/**
 * Shared "connect a provider via OAuth" body for single-provider plugin settings panels (GitHub,
 * GitLab, Bitbucket) — keeps their real-vs-stub connect/disconnect UI identical.
 */
export function ProviderConnectionPanel({
  title,
  description,
  providerLabel,
  connected,
  connectedLabel,
  onConnect,
  onDisconnect,
}: ProviderConnectionPanelProps) {
  return (
    <>
      <div>
        <div className={styles.title}>{title}</div>
        <div className={styles.description}>{description}</div>
      </div>

      <div>
        <div className={styles.sectionLabel}>Connection</div>
        {connected ? (
          <div className={styles.connectedRow}>
            <span className={styles.statusRow} data-tone="ok">
              <Check size={13} />
              {connectedLabel ?? 'Connected'}
            </span>
            {onDisconnect && (
              <button type="button" className={styles.disconnectBtn} onClick={onDisconnect}>
                Disconnect
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            className={styles.connectBtn}
            disabled={!onConnect}
            title={onConnect ? undefined : 'Coming soon'}
            onClick={onConnect}
          >
            Connect with {providerLabel}
          </button>
        )}
      </div>
    </>
  );
}
