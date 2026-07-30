import { useState, type ComponentType } from 'react';
import { X, SlidersVertical, Route, Shield } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { saveNow } from '../../lib/projectAutosave';
import { GeneralSettingsPanel } from '../SettingsModal/GeneralSettingsPanel';
import { ServersSettingsPanel } from '../SettingsModal/ServersSettingsPanel';
import { SecuritySettingsPanel } from '../SettingsModal/SecuritySettingsPanel';
import { snapshotFromStore, type ProjectSettingsDraft } from './projectSettingsDraft';
import styles from '../SettingsModal/SettingsModal.module.css';

interface ProjectPanelProps {
  draft: ProjectSettingsDraft;
  onChange: (patch: Partial<ProjectSettingsDraft>) => void;
}

interface ProjectCategory {
  key: string;
  label: string;
  icon: ComponentType<{ size?: number | string }>;
  panel: ComponentType<ProjectPanelProps>;
}

const CATEGORIES: ProjectCategory[] = [
  { key: 'general', label: 'General', icon: SlidersVertical, panel: GeneralSettingsPanel },
  { key: 'servers', label: 'Servers & External Docs', icon: Route, panel: ServersSettingsPanel },
  { key: 'security', label: 'Security Schemes', icon: Shield, panel: SecuritySettingsPanel },
];

/**
 * Per-project settings (General / Servers & External Docs / Security Schemes) — split out from
 * the app-level Settings modal since these describe the document you're editing, not the app.
 * Opened from Topbar :: More actions :: Project Settings.
 *
 * Edits across all three tabs are held as a local draft, not written live — OK and Apply commit
 * the draft to the real stores. Apply stays disabled until the draft actually differs from the
 * baseline it was opened/last-applied with, since there'd be nothing new to save; OK instead
 * stays enabled for the rest of this open once any edit has been made, even right after an Apply,
 * since it always has a dialog to dismiss. Cancel just closes, discarding the draft untouched.
 */
export function ProjectSettingsModal() {
  const closeProjectSettings = useAppStore((s) => s.closeProjectSettings);
  const [activeKey, setActiveKey] = useState(CATEGORIES[0].key);
  const [draft, setDraft] = useState<ProjectSettingsDraft>(snapshotFromStore);
  const [baseline, setBaseline] = useState<ProjectSettingsDraft>(snapshotFromStore);
  const [everEdited, setEverEdited] = useState(false);

  const active = CATEGORIES.find((c) => c.key === activeKey) ?? CATEGORIES[0];
  const Panel = active.panel;
  const isDirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  const handleChange = (patch: Partial<ProjectSettingsDraft>) => {
    setEverEdited(true);
    setDraft((d) => ({ ...d, ...patch }));
  };

  const commit = () => {
    useAppStore.getState().applyProjectSettingsDraft({
      currentProjectName: draft.currentProjectName,
      apiOpenapiVersion: draft.apiOpenapiVersion,
      apiTitle: draft.apiTitle,
      apiVersion: draft.apiVersion,
      apiDescription: draft.apiDescription,
      apiTermsOfService: draft.apiTermsOfService,
      apiContact: draft.apiContact,
      apiLicense: draft.apiLicense,
      apiServers: draft.apiServers,
      apiExternalDocs: draft.apiExternalDocs,
    });
    useSpecStore
      .getState()
      .applySecurityDraft(draft.enabledSecuritySchemes, draft.securityScopes, draft.removedLegacySchemes);
    saveNow();
  };

  const handleOk = () => {
    commit();
    closeProjectSettings();
  };

  const handleApply = () => {
    commit();
    setBaseline(draft);
  };

  return (
    <div className={styles.scrim} onClick={closeProjectSettings}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.split}>
          <div className={styles.rail}>
            <div className={styles.railHead}>
              <div className={styles.railTitle}>Project Settings</div>
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
              <button type="button" className={styles.closeBtn} title="Close" onClick={closeProjectSettings}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.paneBody}>
              <Panel draft={draft} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.footerSpacer} />
          <button type="button" className={`${styles.btn} ${styles.btnOk}`} disabled={!everEdited} onClick={handleOk}>
            OK
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnCancel}`} onClick={closeProjectSettings}>
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnApply}`}
            disabled={!isDirty}
            title="Save this project locally right now, without closing"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}