import { useAppStore } from '../../state/useAppStore';
import styles from './EditorPreferencesSettingsPanel.module.css';

export function EditorPreferencesSettingsPanel() {
  const preferences = useAppStore((s) => s.apiforgePreferences);
  const setApiforgePreference = useAppStore((s) => s.setApiforgePreference);

  return (
    <div>
      <div className={styles.headerRow}>
        <div className={styles.headerTitle}>Editor defaults</div>
        <span className={styles.namespaceBadge}>x-apiforge</span>
      </div>
      <div className={styles.description}>
        Saved alongside the spec under <code className={styles.code}>x-apiforge.preferences</code> — shapes editor
        defaults and codegen suggestions. Stripped automatically from Clean OpenAPI exports.
      </div>

      <div className={styles.grid}>
        <div>
          <div className={styles.fieldLabel}>operationId style</div>
          <select
            className={styles.monoSelect}
            value={preferences.operationIdStyle}
            onChange={(e) =>
              setApiforgePreference('operationIdStyle', e.target.value as typeof preferences.operationIdStyle)
            }
          >
            <option value="lowerCamelCase">lowerCamelCase</option>
            <option value="snake_case">snake_case</option>
            <option value="kebab-case">kebab-case</option>
          </select>
          <div className={styles.fieldHint}>Used by the ✨ operationId generator.</div>
        </div>

        <div>
          <div className={styles.fieldLabel}>Tag mode</div>
          <select
            className={styles.select}
            value={preferences.tagMode}
            onChange={(e) => setApiforgePreference('tagMode', e.target.value as typeof preferences.tagMode)}
          >
            <option value="operation">Per operation</option>
            <option value="resource">Per resource</option>
          </select>
          <div className={styles.fieldHint}>
            &quot;Per resource&quot; auto-tags a new path&apos;s first endpoint from its final segment.
          </div>
        </div>

        <div>
          <div className={styles.fieldLabel}>Resource naming</div>
          <select
            className={styles.select}
            value={preferences.resourceNamingStyle}
            onChange={(e) =>
              setApiforgePreference('resourceNamingStyle', e.target.value as typeof preferences.resourceNamingStyle)
            }
          >
            <option value="singularResource">Singular</option>
            <option value="pluralResource">Plural</option>
          </select>
          <div className={styles.fieldHint}>
            Shapes collection-level operationIds &amp; auto tags (listCharge vs listCharges).
          </div>
        </div>

        <div>
          <div className={styles.fieldLabel}>Default response view</div>
          <select
            className={styles.select}
            value={preferences.defaultResponseView}
            onChange={(e) =>
              setApiforgePreference('defaultResponseView', e.target.value as typeof preferences.defaultResponseView)
            }
          >
            <option value="structured">Structured</option>
            <option value="raw">Raw JSON</option>
          </select>
          <div className={styles.fieldHint}>
            Sets whether the compiled-code panel starts open (&quot;Raw&quot;) or collapsed (&quot;Structured&quot;).
          </div>
        </div>
      </div>
    </div>
  );
}
