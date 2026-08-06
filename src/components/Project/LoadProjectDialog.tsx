import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, LoaderCircle } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { listServerProjects, type ServerProjectSummary } from '../../lib/api/projects';
import { openServerProjectIntoSettings } from '../../lib/loadServerProject';
import { importOpenApiFile, IMPORT_ACCEPT } from '../../lib/importHandler';
import styles from './LoadProjectDialog.module.css';

type AsyncState<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T };
type SortColumn = 'name' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE = 10;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

function statusLabel(project: ServerProjectSummary): string {
  const status = project.status?.trim();
  return status ? status.replace(/[-_]+/g, ' ') : 'Active';
}

export function LoadProjectDialog() {
  const closeProjectList = useAppStore((s) => s.closeLoadProjectDialog);
  const openProjectFromVersionControl = useAppStore((s) => s.openProjectFromVersionControl);
  const [projects, setProjects] = useState<AsyncState<ServerProjectSummary[]>>({ status: 'loading' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listServerProjects()
      .then((data) => setProjects({ status: 'ready', data }))
      .catch((error) =>
        setProjects({ status: 'error', message: error instanceof Error ? error.message : String(error) }),
      );
  }, []);

  const sortedProjects = useMemo(() => {
    if (projects.status !== 'ready') return [];
    return [...projects.data].sort((a, b) => {
      const comparison =
        sortColumn === 'name'
          ? a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          : new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [projects, sortColumn, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(sortedProjects.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleProjects = sortedProjects.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [sortColumn, sortDirection]);

  const toggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortColumn(column);
    setSortDirection(column === 'name' ? 'asc' : 'desc');
  };

  const openProject = async (id: string) => {
    if (opening) return;
    setOpening(true);
    try {
      await openServerProjectIntoSettings(id);
    } finally {
      setOpening(false);
    }
  };

  const loadFromVersionControl = () => {
    closeProjectList();
    openProjectFromVersionControl();
  };

  return (
    <section className={styles.page} aria-labelledby="project-list-title">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Projects</p>
          <h1 id="project-list-title" className={styles.title}>Open a project</h1>
          <p className={styles.subtitle}>Select a project below, then open it or double-click its row.</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={closeProjectList}>Back to editor</button>
      </header>

      <div className={styles.content}>
        <div className={styles.tableCard}>
          <div className={styles.tableHeader} role="row">
            <button type="button" className={styles.sortHeader} onClick={() => toggleSort('name')}>
              Name
              {sortColumn === 'name' && (sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
            </button>
            <span>Status</span>
            <button type="button" className={styles.sortHeader} onClick={() => toggleSort('updatedAt')}>
              Updated date
              {sortColumn === 'updatedAt' && (sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
            </button>
          </div>

          <div className={styles.tableBody}>
            {projects.status === 'loading' && (
              <div className={styles.stateMessage}><LoaderCircle size={18} className={styles.spin} /> Loading projects…</div>
            )}
            {projects.status === 'error' && <div className={styles.errorMessage}>{projects.message}</div>}
            {projects.status === 'ready' && projects.data.length === 0 && (
              <div className={styles.stateMessage}>No projects are available yet.</div>
            )}
            {projects.status === 'ready' && visibleProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                className={styles.projectRow}
                data-selected={project.id === selectedId}
                aria-pressed={project.id === selectedId}
                onClick={() => setSelectedId(project.id)}
                onDoubleClick={() => void openProject(project.id)}
              >
                <span className={styles.projectName}>{project.name}</span>
                <span className={styles.statusBadge}>{statusLabel(project)}</span>
                <time className={styles.updatedDate} dateTime={project.updatedAt}>{formatDate(project.updatedAt)}</time>
              </button>
            ))}
          </div>

          <nav className={styles.pagination} aria-label="Project list pagination">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage(1)}>First</button>
            <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <div className={styles.pageNumbers}>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  data-current={pageNumber === currentPage}
                  aria-current={pageNumber === currentPage ? 'page' : undefined}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
            <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
            <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(pageCount)}>Last</button>
          </nav>
        </div>
      </div>

      <footer className={styles.actions}>
        <input
          ref={fileInputRef}
          type="file"
          accept={IMPORT_ACCEPT}
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            void importOpenApiFile(file).then(() => {
              if (useSpecStore.getState().importStatus?.type === 'success') closeProjectList();
            });
          }}
        />
        <button type="button" className={styles.secondaryAction} onClick={() => fileInputRef.current?.click()}>
          Import OpenAPI document
        </button>
        <button type="button" className={styles.secondaryAction} onClick={loadFromVersionControl}>
          Load from version control
        </button>
        <span className={styles.actionSpacer} />
        <button
          type="button"
          className={styles.primaryAction}
          disabled={!selectedId || opening}
          onClick={() => selectedId && void openProject(selectedId)}
        >
          {opening ? 'OPENING…' : 'OPEN PROJECT'}
        </button>
      </footer>
    </section>
  );
}
