import { useEffect, useRef, useState } from 'react';
import { X, LoaderCircle } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { formatRelativeTime } from '../../lib/projects';
import { listServerProjects, type ServerProjectSummary } from '../../lib/api/projects';
import { openServerProjectIntoSettings } from '../../lib/loadServerProject';
import { importOpenApiFile, IMPORT_ACCEPT } from '../../lib/importHandler';
import styles from './LoadProjectDialog.module.css';

type AsyncState<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T };

/**
 * Topbar :: More actions :: Load Project — lists this user's projects from the server (GET
 * /projects, proposed in docs/project-server-storage-api-proposal.md — not built yet, so this
 * shows an error state until the backend catches up), plus entry points into the other two ways
 * to bring in a project: importing a file from disk, or browsing a connected Version Control
 * repo. Picking a project drops straight into Project Settings :: General with the loaded data.
 * Importing a file behaves exactly like the empty-state's Import link — named directly from the
 * document's own title, no popup — this dialog just closes itself once that succeeds. Version
 * Control keeps its own existing flow (naming popup) unchanged.
 */
export function LoadProjectDialog() {
  const closeDialog = useAppStore((s) => s.closeLoadProjectDialog);
  const openProjectFromVersionControl = useAppStore((s) => s.openProjectFromVersionControl);
  const [projects, setProjects] = useState<AsyncState<ServerProjectSummary[]>>({ status: 'loading' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listServerProjects()
      .then((data) => setProjects({ status: 'ready', data }))
      .catch((err) => setProjects({ status: 'error', message: err instanceof Error ? err.message : String(err) }));
  }, []);

  const open = async (id: string) => {
    setOpening(true);
    await openServerProjectIntoSettings(id);
    setOpening(false);
  };

  const loadFromVersionControl = () => {
    closeDialog();
    openProjectFromVersionControl();
  };

  return (
    <div className={styles.scrim} onClick={closeDialog}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.title}>Load Project</div>
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
              if (!file) return;
              void importOpenApiFile(file).then(() => {
                if (useSpecStore.getState().importStatus?.type === 'success') closeDialog();
              });
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
