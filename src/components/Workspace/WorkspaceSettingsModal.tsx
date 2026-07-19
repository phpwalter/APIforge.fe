import { useState, type ComponentType } from 'react';
import { X, SlidersVertical, Route, ShieldCog } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { GeneralSettingsPanel } from '../SettingsModal/GeneralSettingsPanel';
import { ServersSettingsPanel } from '../SettingsModal/ServersSettingsPanel';
import { SecuritySettingsPanel } from '../SettingsModal/SecuritySettingsPanel';
import styles from '../SettingsModal/SettingsModal.module.css';

interface WorkspaceCategory {
  key: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  panel: ComponentType;
}

const CATEGORIES: WorkspaceCategory[] = [
  { key: 'general', label: 'General', icon: SlidersVertical, panel: GeneralSettingsPanel },
  { key: 'servers', label: 'Servers & External Docs', icon: Route, panel: ServersSettingsPanel },
  { key: 'security', label: 'Security Schemes', icon: ShieldCog, panel: SecuritySettingsPanel },
];

/**
 * Per-workspace settings (General / Servers & External Docs / Security Schemes) — split out from
 * the app-level Settings modal since these describe the document you're editing, not the app.
 * Opened from Topbar :: More actions :: Workspace Settings.
 */
export function WorkspaceSettingsModal() {
  const closeWorkspaceSettings = useAppStore((s) => s.closeWorkspaceSettings);
  const isNewWorkspace = useAppStore((s) => s.isNewWorkspace);
  const [activeKey, setActiveKey] = useState(CATEGORIES[0].key);

  const active = CATEGORIES.find((c) => c.key === activeKey) ?? CATEGORIES[0];
  const Panel = active.panel;

  return (
    <div className={styles.scrim} onClick={closeWorkspaceSettings}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.split}>
          <div className={styles.rail}>
            <div className={styles.railHead}>
              <div className={styles.railTitle}>Workspace Settings</div>
            </div>
            <div className={styles.navList}>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    className={styles.navRow}
                    data-active={cat.key === active.key}
                    onClick={() => setActiveKey(cat.key)}
                  >
                    <span className={styles.navRowIcon}>
                      <Icon size={15} />
                    </span>
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.pane}>
            <div className={styles.paneHeader}>
              <span className={styles.paneTitleIcon}>
                <active.icon size={16} />
              </span>
              <div className={styles.paneTitle}>{active.label}</div>
              <button type="button" className={styles.closeBtn} title="Close" onClick={closeWorkspaceSettings}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.paneBody}>
              <Panel />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.footerSpacer} />
          {isNewWorkspace ? (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSave}`}
              disabled
              title="Save to server — coming soon"
            >
              Save
            </button>
          ) : (
            <button type="button" className={`${styles.btn} ${styles.btnOk}`} onClick={closeWorkspaceSettings}>
              OK
            </button>
          )}
          <button type="button" className={`${styles.btn} ${styles.btnCancel}`} onClick={closeWorkspaceSettings}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
