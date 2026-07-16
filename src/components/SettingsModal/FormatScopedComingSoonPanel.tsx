import { useState } from 'react';
import type { RestProjectionFormat } from '../../types/ui';
import settingsStyles from './SettingsModal.module.css';
import styles from './FormatScopedComingSoonPanel.module.css';

const FORMATS: RestProjectionFormat[] = ['yaml', 'json'];

interface FormatScopedComingSoonPanelProps {
  title: string;
  description: string;
}

/** Shared shell for Editor Preferences children that will eventually be configured per format (Color Scheme, Color Style, File Encoding) — format tabs now, "Coming Soon" content until each is wired up. */
export function FormatScopedComingSoonPanel({ title, description }: FormatScopedComingSoonPanelProps) {
  const [format, setFormat] = useState<RestProjectionFormat>('yaml');

  return (
    <>
      <div>
        <div className={styles.title}>{title}</div>
        <div className={styles.description}>{description}</div>
      </div>

      <div className={styles.formatSwitch}>
        {FORMATS.map((f) => (
          <button
            key={f}
            type="button"
            className={styles.formatPill}
            data-active={format === f}
            onClick={() => setFormat(f)}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className={settingsStyles.comingSoonWrap}>
        <div className={settingsStyles.comingSoon}>
          <div className={settingsStyles.comingSoonTitle}>Coming Soon</div>
          <div className={settingsStyles.comingSoonHint}>
            {title} for {format.toUpperCase()} isn&apos;t configurable yet.
          </div>
        </div>
      </div>
    </>
  );
}
