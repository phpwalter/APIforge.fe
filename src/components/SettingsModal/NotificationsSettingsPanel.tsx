import { useAppStore } from '../../state/useAppStore';
import styles from './NotificationsSettingsPanel.module.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={styles.switch}
      data-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.switchThumb} />
    </button>
  );
}

const NOTIFICATION_ROWS = [
  {
    key: 'importExportStatus' as const,
    label: 'Import & export status',
    hint: 'Toast message when a document import or export finishes or fails.',
  },
  {
    key: 'diagnosticsAlerts' as const,
    label: 'Diagnostics alerts',
    hint: 'Notify when policy compliance issues are found after an edit.',
  },
  {
    key: 'autosaveConfirmations' as const,
    label: 'Autosave confirmations',
    hint: 'Brief confirmation each time your changes are saved to this browser.',
  },
];

export function NotificationsSettingsPanel() {
  const preferences = useAppStore((s) => s.notificationPreferences);
  const setNotificationPreference = useAppStore((s) => s.setNotificationPreference);

  return (
    <>
      <div>
        <div className={styles.title}>Notifications</div>
        <div className={styles.description}>
          Local, in-browser alerts — APIforge doesn&apos;t send email or push notifications; these control what you
          see while working in this browser.
        </div>
      </div>

      <div className={styles.rows}>
        {NOTIFICATION_ROWS.map((row) => (
          <div key={row.key} className={styles.row}>
            <div>
              <div className={styles.rowLabel}>{row.label}</div>
              <div className={styles.rowHint}>{row.hint}</div>
            </div>
            <Switch
              checked={preferences[row.key]}
              onChange={(v) => setNotificationPreference(row.key, v)}
              label={row.label}
            />
          </div>
        ))}
      </div>
    </>
  );
}
