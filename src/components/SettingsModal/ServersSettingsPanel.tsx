import { Plus, X } from 'lucide-react';
import type { ProjectSettingsDraft } from '../Project/projectSettingsDraft';
import styles from './ServersSettingsPanel.module.css';

interface ServersSettingsPanelProps {
  draft: ProjectSettingsDraft;
  onChange: (patch: Partial<ProjectSettingsDraft>) => void;
}

export function ServersSettingsPanel({ draft, onChange }: ServersSettingsPanelProps) {
  return (
    <>
      <div>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Servers</span>
          <button
            type="button"
            className={styles.addBtn}
            title="Add server"
            onClick={() => onChange({ apiServers: [...draft.apiServers, ''] })}
          >
            <Plus size={12} />
          </button>
        </div>
        {draft.apiServers.length === 0 && <div className={styles.emptyText}>No servers defined.</div>}
        <div className={styles.serverList}>
          {draft.apiServers.map((url, index) => (
            <div key={index} className={styles.serverRow}>
              <input
                className={styles.serverInput}
                value={url}
                placeholder="https://api.example.com"
                onChange={(e) =>
                  onChange({ apiServers: draft.apiServers.map((u, i) => (i === index ? e.target.value : u)) })
                }
              />
              <button
                type="button"
                className={styles.removeBtn}
                title="Remove server"
                onClick={() => onChange({ apiServers: draft.apiServers.filter((_, i) => i !== index) })}
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
            value={draft.apiExternalDocs.description}
            placeholder="Description"
            onChange={(e) =>
              onChange({ apiExternalDocs: { ...draft.apiExternalDocs, description: e.target.value } })
            }
          />
          <input
            className={styles.monoInputSmall}
            value={draft.apiExternalDocs.url}
            placeholder="https://docs.example.com"
            onChange={(e) => onChange({ apiExternalDocs: { ...draft.apiExternalDocs, url: e.target.value } })}
          />
        </div>
      </div>
    </>
  );
}
