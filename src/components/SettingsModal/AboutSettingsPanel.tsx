import { Layers } from 'lucide-react';
import { APP_VERSION } from '../../lib/appInfo';
import styles from './AboutSettingsPanel.module.css';

const INFO_ROWS = [
  { label: 'Version', value: APP_VERSION },
  { label: 'OpenAPI support', value: '3.0.x – 3.1.1' },
  { label: 'Extension namespace', value: 'x-apiforge' },
  { label: 'UI Version', value: '12.18.4-ui-60709-0233' },
  { label: 'Platform Version', value: '12.18.4' },
];

const LINKS = ['Terms', 'Privacy', 'Security', 'Community', 'Contact'];

export function AboutSettingsPanel() {
  return (
    <>
      <div className={styles.brandRow}>
        <span className={styles.brandIcon}>
          <Layers size={22} />
        </span>
        <div>
          <div className={styles.brandName}>APIforge</div>
          <div className={styles.brandSubtitle}>Version {APP_VERSION} · OpenAPI 3.1.0</div>
        </div>
      </div>

      <div className={styles.description}>
        An in-browser visual editor for authoring OpenAPI specs — paths, methods, request &amp; response
        schemas, security schemes, and governance diagnostics, with a live REST projection preview.
      </div>

      <div className={styles.infoList}>
        {INFO_ROWS.map((row) => (
          <div key={row.label} className={styles.infoRow}>
            <span className={styles.infoLabel}>{row.label}</span>
            <span className={styles.infoValue}>{row.value}</span>
          </div>
        ))}
      </div>

      <div className={styles.linksBlock}>
        <div className={styles.linksRow}>
          {LINKS.map((label) => (
            <button key={label} type="button" className={styles.link}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" className={styles.faintLink}>
          Do not share my personal information
        </button>
      </div>
    </>
  );
}
