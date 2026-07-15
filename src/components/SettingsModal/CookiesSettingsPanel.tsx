import { useAppStore } from '../../state/useAppStore';
import { LEGAL_DOCS } from '../../lib/legalDocs';
import styles from './CookiesSettingsPanel.module.css';

interface SwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function Switch({ checked, disabled, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={styles.switch}
      data-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.switchThumb} />
    </button>
  );
}

/** Cookie category preferences — Strictly Necessary is always on and isn't persisted (nothing to opt out of). */
export function CookiesSettingsPanel() {
  const cookiePrefs = useAppStore((s) => s.cookiePrefs);
  const setCookiePref = useAppStore((s) => s.setCookiePref);
  const openDocDialog = useAppStore((s) => s.openDocDialog);

  const cookiesDoc = LEGAL_DOCS.Cookies;

  return (
    <>
      <div>
        <div className={styles.title}>Cookies</div>
        <div className={styles.description}>
          Choose which optional cookies APIforge can use in this browser. Strictly necessary cookies are always on —
          they&apos;re required for sign-in and core functionality.
        </div>
      </div>

      <div className={styles.rows}>
        <div className={styles.row}>
          <div>
            <div className={styles.rowLabel}>Strictly Necessary</div>
            <div className={styles.rowHint}>Required for sign-in and core functionality. Always on.</div>
          </div>
          <Switch checked disabled onChange={() => {}} label="Strictly Necessary" />
        </div>

        <div className={styles.row}>
          <div>
            <div className={styles.rowLabel}>Analytics</div>
            <div className={styles.rowHint}>Helps us understand feature usage to improve APIforge.</div>
          </div>
          <Switch
            checked={cookiePrefs.analytics}
            onChange={(v) => setCookiePref('analytics', v)}
            label="Analytics"
          />
        </div>

        <div className={styles.row}>
          <div>
            <div className={styles.rowLabel}>Marketing</div>
            <div className={styles.rowHint}>Personalizes announcements and product updates.</div>
          </div>
          <Switch
            checked={cookiePrefs.marketing}
            onChange={(v) => setCookiePref('marketing', v)}
            label="Marketing"
          />
        </div>
      </div>

      {cookiesDoc && (
        <div className={styles.linksBlock}>
          <button
            type="button"
            className={styles.link}
            onClick={() => openDocDialog(cookiesDoc.title, cookiesDoc.src)}
          >
            Cookie Policy
          </button>
        </div>
      )}
    </>
  );
}
