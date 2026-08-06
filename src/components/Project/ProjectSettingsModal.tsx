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
  const isNewProject = useAppStore((s) => s.isNewProject);
  const [activeKey, setActiveKey] = useState(CATEGORIES[0].key);
  const [draft, setDraft] = useState<ProjectSettingsDraft>(snapshotFromStore);
  const [baseline, setBaseline] = useState<ProjectSettingsDraft>(snapshotFromStore);
  const [everEdited, setEverEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const active = CATEGORIES.find((category) => category.key === activeKey) ?? CATEGORIES[0];
  const Panel = active.panel;
  const isDirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  const handleChange = (patch: Partial<ProjectSettingsDraft>) => {
    setEverEdited(true);
    setSaveError(null);
    setDraft((current) => ({ ...current, ...patch }));
  };

  const applyDraft = () => {
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
  };

  const persist = async (closeAfterSave: boolean) => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);

    try {
      applyDraft();
      await saveNow({ persistNewProject: true });
      setBaseline(snapshotFromStore());
      setEverEdited(!closeAfterSave);
      if (closeAfterSave) closeProjectSettings();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'The project could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const primaryLabel = saving ? 'SAVING…' : isNewProject ? 'SAVE' : 'OK';
  const primaryDisabled = saving || (!isNewProject && !everEdited);
  const applyDisabled = saving || !isDirty;

  return (
    <div className={styles.scrim} onClick={saving ? undefined : closeProjectSettings}>
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
                    disabled={saving}
                  >
                    <span className={styles.navRowIcon}>
                      <Icon size={15} />
                    </span>
                    {category.label}
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
              <button
                type="button"
                className={styles.closeBtn}
                title="Close"
                onClick={closeProjectSettings}
                disabled={saving}
              >
                <X size={16} />
              </button>
            </div>
            <div className={styles.paneBody}>
              <Panel draft={draft} onChange={handleChange} />
              {saveError && (
                <div role="alert" aria-live="polite">
                  {saveError}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.footerSpacer} />
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOk}`}
            disabled={primaryDisabled}
            onClick={() => void persist(true)}
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnCancel}`}
            onClick={closeProjectSettings}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnApply}`}
            disabled={applyDisabled}
            title="Save project changes without closing"
            onClick={() => void persist(false)}
          >
            {saving ? 'Saving…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}
