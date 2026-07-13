import { useAppStore } from '../../state/useAppStore';
import styles from './GeneralSettingsPanel.module.css';

const OPENAPI_VERSIONS = ['3.1.0', '3.1.1', '3.0.3', '3.0.2', '3.0.1', '3.0.0'];

export function GeneralSettingsPanel() {
  const apiOpenapiVersion = useAppStore((s) => s.apiOpenapiVersion);
  const setApiOpenapiVersion = useAppStore((s) => s.setApiOpenapiVersion);

  const apiTitle = useAppStore((s) => s.apiTitle);
  const apiVersion = useAppStore((s) => s.apiVersion);
  const apiDescription = useAppStore((s) => s.apiDescription);
  const apiTermsOfService = useAppStore((s) => s.apiTermsOfService);
  const setApiField = useAppStore((s) => s.setApiField);

  const apiContact = useAppStore((s) => s.apiContact);
  const setApiContactField = useAppStore((s) => s.setApiContactField);

  const apiLicense = useAppStore((s) => s.apiLicense);
  const setApiLicenseField = useAppStore((s) => s.setApiLicenseField);

  return (
    <>
      <div>
        <div className={styles.fieldLabel}>OpenAPI Version</div>
        <select
          className={styles.versionSelect}
          value={apiOpenapiVersion}
          onChange={(e) => setApiOpenapiVersion(e.target.value)}
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
            value={apiTitle}
            onChange={(e) => setApiField('title', e.target.value)}
          />
        </div>
        <div>
          <div className={styles.fieldLabel}>Version</div>
          <input
            className={styles.monoInput}
            value={apiVersion}
            onChange={(e) => setApiField('version', e.target.value)}
          />
        </div>
      </div>

      <div>
        <div className={styles.fieldLabel}>Description</div>
        <textarea
          className={styles.textarea}
          rows={3}
          value={apiDescription}
          onChange={(e) => setApiField('description', e.target.value)}
        />
      </div>

      <div>
        <div className={styles.fieldLabel}>Terms of Service URL</div>
        <input
          className={styles.monoInput}
          value={apiTermsOfService}
          placeholder="https://example.com/terms"
          onChange={(e) => setApiField('termsOfService', e.target.value)}
        />
      </div>

      <div>
        <div className={styles.sectionLabel}>Contact</div>
        <div className={styles.twoCol}>
          <input
            className={styles.textInputSmall}
            value={apiContact.name}
            placeholder="Name"
            onChange={(e) => setApiContactField('name', e.target.value)}
          />
          <input
            className={styles.textInputSmall}
            value={apiContact.email}
            placeholder="Email"
            onChange={(e) => setApiContactField('email', e.target.value)}
          />
        </div>
        <input
          className={styles.monoInputSmall}
          value={apiContact.url}
          placeholder="Contact URL"
          onChange={(e) => setApiContactField('url', e.target.value)}
        />
      </div>

      <div>
        <div className={styles.sectionLabel}>License</div>
        <div className={styles.twoCol}>
          <input
            className={styles.textInputSmall}
            value={apiLicense.name}
            placeholder="Name (e.g. Apache 2.0)"
            onChange={(e) => setApiLicenseField('name', e.target.value)}
          />
          <input
            className={styles.monoInputSmall}
            value={apiLicense.url}
            placeholder="License URL"
            onChange={(e) => setApiLicenseField('url', e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
