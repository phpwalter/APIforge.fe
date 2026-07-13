import { Plus, X } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import styles from './ServersSettingsPanel.module.css';

export function ServersSettingsPanel() {
  const apiServers = useAppStore((s) => s.apiServers);
  const addApiServer = useAppStore((s) => s.addApiServer);
  const removeApiServer = useAppStore((s) => s.removeApiServer);
  const setApiServerUrl = useAppStore((s) => s.setApiServerUrl);

  const apiExternalDocs = useAppStore((s) => s.apiExternalDocs);
  const setApiExternalDocsField = useAppStore((s) => s.setApiExternalDocsField);

  return (
    <>
      <div>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Servers</span>
          <button type="button" className={styles.addBtn} title="Add server" onClick={addApiServer}>
            <Plus size={12} />
          </button>
        </div>
        {apiServers.length === 0 && <div className={styles.emptyText}>No servers defined.</div>}
        <div className={styles.serverList}>
          {apiServers.map((url, index) => (
            <div key={index} className={styles.serverRow}>
              <input
                className={styles.serverInput}
                value={url}
                placeholder="https://api.example.com"
                onChange={(e) => setApiServerUrl(index, e.target.value)}
              />
              <button
                type="button"
                className={styles.removeBtn}
                title="Remove server"
                onClick={() => removeApiServer(index)}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className={styles.sectionLabel} style={{ marginBottom: 8 }}>
          External Docs
        </div>
        <div className={styles.extDocsFields}>
          <input
            className={styles.textInputSmall}
            value={apiExternalDocs.description}
            placeholder="Description"
            onChange={(e) => setApiExternalDocsField('description', e.target.value)}
          />
          <input
            className={styles.monoInputSmall}
            value={apiExternalDocs.url}
            placeholder="https://docs.example.com"
            onChange={(e) => setApiExternalDocsField('url', e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
