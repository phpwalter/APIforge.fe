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

export function ProjectSettingsModal() {
  const closeProjectSettings = useAppStore((s) => s.closeProjectSettings);
  const [activeKey, setActiveKey] = useState(CATEGORIES[0].key);
  const [draft, setDraft] = useState<ProjectSettingsDraft>(snapshotFromStore);
  const [baseline, setBaseline] = useState<ProjectSettingsDraft>(snapshotFromStore);
  const [everEdited, setEverEdited] = useState(false);

  const active = CATEGORIES.find((category) => category.key === activeKey) ?? CATEGORIES[0];
  const Panel = active.panel;
  const isDirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  const handleChange = (patch: Partial<ProjectSettingsDraft>) => {
    setEverEdited(true);
    setDraft((current) => ({ ...current, ...patch }));
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
    void saveNow().catch(() => undefined);
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
      <div className={styles.dialog} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.split}>
          <div className={styles.rail}>
            <div className={styles.railHead}>
              <div className={styles.railTitle}>Project Settings</div>
            </div>
            <div className={styles.navList}>
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.key}
                    type="button"
                    className={styles.navRow}
                    data-active={category.key === active.key}
                    onClick={() => setActiveKey(category.key)}
                  >
                    <span className={styles.navRowIcon}><Icon size={15} /></span>
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.pane}>
            <div className={styles.paneHeader}>
              <span className={styles.paneTitleIcon}><active.icon size={16} /></span>
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
            title="Save project settings locally without closing"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
