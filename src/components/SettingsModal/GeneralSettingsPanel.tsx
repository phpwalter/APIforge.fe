import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { ProjectSettingsDraft } from '../Project/projectSettingsDraft';
import { listLicenses, type LicenseCatalogEntry } from '../../lib/api/licenses';
import styles from './GeneralSettingsPanel.module.css';

const OPENAPI_VERSIONS = ['3.2.0', '3.1.0', '3.1.1', '3.0.3', '3.0.2', '3.0.1', '3.0.0'];
const PROPRIETARY_VALUE = '__proprietary__';

interface GeneralSettingsPanelProps {
  draft: ProjectSettingsDraft;
  onChange: (patch: Partial<ProjectSettingsDraft>) => void;
}

export function GeneralSettingsPanel({ draft, onChange }: GeneralSettingsPanelProps) {
  const [licenses, setLicenses] = useState<LicenseCatalogEntry[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(true);
  const [licensesError, setLicensesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLicensesLoading(true);
    setLicensesError(null);

    void listLicenses()
      .then((entries) => {
        if (!cancelled) setLicenses(entries);
      })
      .catch((error) => {
        if (!cancelled) {
          setLicensesError(error instanceof Error ? error.message : String(error));
        }
      })
      .finally(() => {
        if (!cancelled) setLicensesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedLicenseValue = useMemo(() => {
    if (!draft.apiLicense.name || draft.apiLicense.name === 'Proprietary') return PROPRIETARY_VALUE;
    if (draft.apiLicense.id && licenses.some((license) => license.id === draft.apiLicense.id)) {
      return draft.apiLicense.id;
    }

    const match = licenses.find(
      (license) => license.spdx_id === draft.apiLicense.spdxId || license.name === draft.apiLicense.name,
    );
    return match?.id ?? PROPRIETARY_VALUE;
  }, [draft.apiLicense, licenses]);

  const handleLicenseChange = (value: string) => {
    if (value === PROPRIETARY_VALUE) {
      onChange({ apiLicense: { id: '', name: 'Proprietary', spdxId: '', url: '' } });
      return;
    }

    const selected = licenses.find((license) => license.id === value);
    if (!selected) return;
    onChange({
      apiLicense: {
        id: selected.id,
        name: selected.name,
        spdxId: selected.spdx_id,
        url: selected.url,
      },
    });
  };

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
        <select
          className={styles.licenseSelect}
          value={selectedLicenseValue}
          disabled={licensesLoading && licenses.length === 0}
          onChange={(event) => handleLicenseChange(event.target.value)}
          aria-label="License"
        >
          <option value={PROPRIETARY_VALUE}>Proprietary</option>
          {licenses.map((license) => (
            <option key={license.id} value={license.id}>
              {license.name}
            </option>
          ))}
        </select>
        {draft.apiLicense.url ? (
          <div className={styles.licenseUrlRow}>
            <span className={styles.licenseUrlLabel}>License URL</span>
            <a
              className={styles.licenseUrlLink}
              href={draft.apiLicense.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {draft.apiLicense.url}
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        ) : null}
        {licensesError ? <div className={styles.catalogError}>License catalog unavailable.</div> : null}
      </div>
    </>
  );
}
