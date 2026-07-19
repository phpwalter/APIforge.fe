import { useEffect, useRef, useState } from 'react';
import { X, LoaderCircle } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { formatRelativeTime } from '../../lib/workspaces';
import { listServerWorkspaces, type ServerWorkspaceSummary } from '../../lib/api/workspaces';
import { openServerWorkspaceIntoSettings } from '../../lib/loadServerWorkspace';
import { importOpenApiFileIntoSettings, IMPORT_ACCEPT } from '../../lib/importHandler';
import styles from './LoadWorkspaceDialog.module.css';

type AsyncState<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T };

/**
 * Topbar :: More actions :: Load Workspace — lists this user's projects from the server (GET
 * /workspaces, proposed in docs/workspace-server-storage-api-proposal.md — not built yet, so this
 * shows an error state until the backend catches up), plus entry points into the other two ways
 * to bring in a workspace: importing a file from disk, or browsing a connected Version Control
 * repo. Picking a project or importing a file both drop straight into Workspace Settings ::
 * General with the loaded data; Version Control keeps its own existing flow (naming popup) unchanged.
 */
export function LoadWorkspaceDialog() {
  const closeDialog = useAppStore((s) => s.closeLoadWorkspaceDialog);
  const openWorkspaceFromVersionControl = useAppStore((s) => s.openWorkspaceFromVersionControl);
  const [projects, setProjects] = useState<AsyncState<ServerWorkspaceSummary[]>>({ status: 'loading' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listServerWorkspaces()
      .then((data) => setProjects({ status: 'ready', data }))
      .catch((err) => setProjects({ status: 'error', message: err instanceof Error ? err.message : String(err) }));
  }, []);

  const open = async (id: string) => {
    setOpening(true);
    await openServerWorkspaceIntoSettings(id);
    setOpening(false);
  };

  const loadFromVersionControl = () => {
    closeDialog();
    openWorkspaceFromVersionControl();
  };

  return (
    <div className={styles.scrim} onClick={closeDialog}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.title}>Load Workspace</div>
          <button type="button" className={styles.closeBtn} title="Close" onClick={closeDialog}>
            <X size={15} />
          </button>
        </div>

        <div className={styles.body}>
          {projects.status === 'loading' && (
            <div className={styles.statusRow}>
              <LoaderCircle size={13} className={styles.spin} /> Loading your projects…
            </div>
          )}
          {projects.status === 'error' && <div className={styles.errorMsg}>{projects.message}</div>}
          {projects.status === 'ready' && projects.data.length === 0 && (
            <div className={styles.emptyState}>
              No projects saved to the server yet — import an OpenAPI document or load one from version control
              below.
            </div>
          )}
          {projects.status === 'ready' && projects.data.length > 0 && (
            <div className={styles.projectList}>
              {projects.data.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={styles.projectRow}
                  data-selected={p.id === selectedId}
                  onClick={() => setSelectedId(p.id)}
                  onDoubleClick={() => void open(p.id)}
                >
                  <span className={styles.projectRowName}>{p.name}</span>
                  <span className={styles.projectRowTime}>{formatRelativeTime(new Date(p.updatedAt).getTime())}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <input
            ref={fileInputRef}
            type="file"
            accept={IMPORT_ACCEPT}
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void importOpenApiFileIntoSettings(file);
            }}
          />
          <button type="button" className={styles.btnSecondary} onClick={() => fileInputRef.current?.click()}>
            Import OpenAPI Document
          </button>
          <button type="button" className={styles.btnSecondary} onClick={loadFromVersionControl}>
            Load from Version Control
          </button>
          <span className={styles.footerSpacer} />
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOpen}`}
            disabled={!selectedId || opening}
            onClick={() => selectedId && void open(selectedId)}
          >
            {opening ? 'Opening…' : 'Open'}
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnCancel}`} onClick={closeDialog}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
