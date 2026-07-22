import type { ProjectSettingsDraft } from '../Project/projectSettingsDraft';
import styles from './GeneralSettingsPanel.module.css';

const OPENAPI_VERSIONS = ['3.1.0', '3.1.1', '3.0.3', '3.0.2', '3.0.1', '3.0.0'];

interface GeneralSettingsPanelProps {
  draft: ProjectSettingsDraft;
  onChange: (patch: Partial<ProjectSettingsDraft>) => void;
}

export function GeneralSettingsPanel({ draft, onChange }: GeneralSettingsPanelProps) {
  return (
    <>
      <div>
        <div className={styles.fieldLabel}>Project Name</div>
        <input
          className={styles.textInput}
          value={draft.currentProjectName ?? ''}
          placeholder="Untitled Project"
          onChange={(e) => onChange({ currentProjectName: e.target.value })}
        />
      </div>

      <div>
        <div className={styles.fieldLabel}>OpenAPI Version</div>
        <select
          className={styles.versionSelect}
          value={draft.apiOpenapiVersion}
          onChange={(e) => onChange({ apiOpenapiVersion: e.target.value })}
        >
          {OPENAPI_VERSIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.titleVersionRow}>
        <div>
          <div className={styles.fieldLabel}>Title</div>
          <input
            className={styles.textInput}
            value={draft.apiTitle}
            onChange={(e) => onChange({ apiTitle: e.target.value })}
          />
        </div>
        <div>
          <div className={styles.fieldLabel}>Version</div>
          <input
            className={styles.monoInput}
            value={draft.apiVersion}
            onChange={(e) => onChange({ apiVersion: e.target.value })}
          />
        </div>
      </div>

      <div>
        <div className={styles.fieldLabel}>Description</div>
        <textarea
          className={styles.textarea}
          rows={3}
          value={draft.apiDescription}
          onChange={(e) => onChange({ apiDescription: e.target.value })}
        />
      </div>

      <div>
        <div className={styles.fieldLabel}>Terms of Service URL</div>
        <input
          className={styles.monoInput}
          value={draft.apiTermsOfService}
          placeholder="https://example.com/terms"
          onChange={(e) => onChange({ apiTermsOfService: e.target.value })}
        />
      </div>

      <div>
        <div className={styles.sectionLabel}>Contact</div>
        <div className={styles.twoCol}>
          <input
            className={styles.textInputSmall}
            value={draft.apiContact.name}
            placeholder="Name"
            onChange={(e) => onChange({ apiContact: { ...draft.apiContact, name: e.target.value } })}
          />
          <input
            className={styles.textInputSmall}
            value={draft.apiContact.email}
            placeholder="Email"
            onChange={(e) => onChange({ apiContact: { ...draft.apiContact, email: e.target.value } })}
          />
        </div>
        <input
          className={styles.monoInputSmall}
          value={draft.apiContact.url}
          placeholder="Contact URL"
          onChange={(e) => onChange({ apiContact: { ...draft.apiContact, url: e.target.value } })}
        />
      </div>

      <div>
        <div className={styles.sectionLabel}>License</div>
        <div className={styles.twoCol}>
          <input
            className={styles.textInputSmall}
            value={draft.apiLicense.name}
            placeholder="Name (e.g. Apache 2.0)"
            onChange={(e) => onChange({ apiLicense: { ...draft.apiLicense, name: e.target.value } })}
          />
          <input
            className={styles.monoInputSmall}
            value={draft.apiLicense.url}
            placeholder="License URL"
            onChange={(e) => onChange({ apiLicense: { ...draft.apiLicense, url: e.target.value } })}
          />
        </div>
      </div>
    </>
  );
}
