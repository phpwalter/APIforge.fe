import { useState } from 'react';
import {
  Layers,
  Share2,
  FolderOpen,
  Save,
  SlidersHorizontal,
  FolderX,
  History,
  ChevronRight,
  Trash2,
  HelpCircle,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { requestNewProject } from '../../lib/newProject';
import { listProjects, formatRelativeTime, deleteProject } from '../../lib/projects';
import { openRecentProject } from '../../lib/reopenProject';
import { computeHasSavableContent } from '../../lib/projectEligibility';
import { saveNow } from '../../lib/projectAutosave';
import styles from './Topbar.module.css';

const RECENT_PROJECTS_LIMIT = 5;

interface MoreMenuProps {
  onExport: () => void;
  onShare: () => void;
}

export function MoreMenu({ onExport, onShare }: MoreMenuProps) {
  const closeMoreMenu = useAppStore((s) => s.closeMoreMenu);
  const openSettings = useAppStore((s) => s.openSettings);
  const openProjectSettings = useAppStore((s) => s.openProjectSettings);
  const openLoadProjectDialog = useAppStore((s) => s.openLoadProjectDialog);
  const closeProject = useAppStore((s) => s.closeProject);
  const currentProjectName = useAppStore((s) => s.currentProjectName);
  const hasDocument = useSpecStore((s) => s.hasDocument);
  const endpoints = useSpecStore((s) => s.endpoints);
  const schemas = useSpecStore((s) => s.schemas);
  const [recentExpanded, setRecentExpanded] = useState(false);
  const [saveExpanded, setSaveExpanded] = useState(false);
  const [savingToServer, setSavingToServer] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canSaveOrClose = computeHasSavableContent(currentProjectName, endpoints.length, schemas.length);

  const run = (fn: () => void) => () => {
    fn();
    closeMoreMenu();
  };

  const recentProjects = recentExpanded ? listProjects().slice(0, RECENT_PROJECTS_LIMIT) : [];

  const confirmDelete = (id: string) => {
    deleteProject(id);
    setConfirmDeleteId(null);
  };

  const saveToServer = async () => {
    if (savingToServer) return;
    setSavingToServer(true);
    setSaveError(null);
    try {
      await saveNow({ persistNewProject: true, requireServer: true });
      closeMoreMenu();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'The project could not be saved to the server.');
    } finally {
      setSavingToServer(false);
    }
  };

  return (
    <>
      <div className={styles.menuScrim} onClick={savingToServer ? undefined : closeMoreMenu} />
      <div className={styles.moreMenu} role="menu">
        <button type="button" className={styles.menuItem} onClick={run(requestNewProject)} disabled={savingToServer}>
          <span className={styles.menuItemIcon}><Layers size={16} /></span>
          <span className={styles.menuItemTrailing}>New Project</span>
        </button>

        <button type="button" className={styles.menuItem} onClick={run(openLoadProjectDialog)} disabled={savingToServer}>
          <span className={styles.menuItemIcon}><FolderOpen size={15} /></span>
          <span className={styles.menuItemTrailing}>Load Project</span>
        </button>

        <button
          type="button"
          className={styles.menuItem}
          onClick={() => setRecentExpanded((value) => !value)}
          aria-expanded={recentExpanded}
          disabled={savingToServer}
        >
          <span className={styles.menuItemIcon}><History size={15} /></span>
          <span className={styles.menuItemTrailing}>Recent Projects</span>
          <ChevronRight size={13} className={recentExpanded ? styles.menuChevronOpen : undefined} />
        </button>
        {recentExpanded && (
          <div className={styles.menuSubList}>
            {recentProjects.length === 0 ? (
              <div className={styles.menuEmpty}>No saved projects yet</div>
            ) : (
              recentProjects.map((project) =>
                confirmDeleteId === project.id ? (
                  <div key={project.id} className={styles.menuSubItemRow}>
                    <div className={styles.menuSubItemConfirm}>
                      <span className={styles.menuSubItemConfirmText}>Remove from list?</span>
                      <button type="button" className={styles.menuSubItemConfirmBtnDanger} onClick={() => confirmDelete(project.id)}>Remove</button>
                      <button type="button" className={styles.menuSubItemConfirmBtn} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div key={project.id} className={styles.menuSubItemRow}>
                    <button type="button" className={styles.menuSubItemOpenBtn} onClick={run(() => openRecentProject(project.id))}>
                      <span className={styles.menuSubItemName}>{project.name}</span>
                      <span className={styles.menuSubItemTime}>{formatRelativeTime(project.savedAt)}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.menuSubItemDeleteBtn}
                      title="Remove from this list — doesn't delete the project"
                      onClick={() => setConfirmDeleteId(project.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ),
              )
            )}
          </div>
        )}

        <button
          type="button"
          className={styles.menuItem}
          disabled={!canSaveOrClose || savingToServer}
          onClick={() => {
            setSaveExpanded((value) => !value);
            setSaveError(null);
          }}
          aria-expanded={saveExpanded}
        >
          <span className={styles.menuItemIcon}><Save size={15} /></span>
          <span className={styles.menuItemTrailing}>Save Project</span>
          <ChevronRight size={13} className={saveExpanded ? styles.menuChevronOpen : undefined} />
        </button>
        {saveExpanded && canSaveOrClose && (
          <div className={styles.menuSubList}>
            <button
              type="button"
              className={styles.menuSubItem}
              disabled={savingToServer}
              onClick={() => void saveToServer()}
            >
              <span className={styles.menuSubItemName}>{savingToServer ? 'Saving to Server…' : 'Save to Server'}</span>
            </button>
            {saveError && <div className={styles.menuEmpty} role="alert">{saveError}</div>}
            <button type="button" className={styles.menuSubItem} onClick={run(onExport)} disabled={savingToServer}>
              <span className={styles.menuSubItemName}>Export OpenAPI to disk</span>
            </button>
          </div>
        )}

        <button
          type="button"
          className={styles.menuDangerItem}
          disabled={!hasDocument || !canSaveOrClose || savingToServer}
          onClick={run(closeProject)}
        >
          <span className={styles.menuItemIcon}><FolderX size={15} /></span>
          <span className={styles.menuItemTrailing}>Close Project</span>
        </button>

        <div className={styles.menuDivider} />
        <button type="button" className={styles.menuItem} disabled={!hasDocument || savingToServer} onClick={run(openProjectSettings)}>
          <span className={styles.menuItemIcon}><SlidersHorizontal size={15} /></span>
          <span className={styles.menuItemTrailing}>Project Settings</span>
        </button>
        <button type="button" className={styles.menuItem} disabled={!hasDocument || savingToServer} onClick={run(onShare)}>
          <span className={styles.menuItemIcon}><Share2 size={15} /></span>
          <span className={styles.menuItemTrailing}>Share</span>
        </button>

        <div className={styles.menuDivider} />
        <button type="button" className={styles.menuItem} onClick={openSettings} disabled={savingToServer}>
          <span className={styles.menuItemIcon}><Layers size={16} /></span>
          <span className={styles.menuItemTrailing}>Settings</span>
        </button>

        <div className={styles.menuDivider} />
        <button type="button" className={styles.menuItem} disabled={savingToServer}>
          <span className={styles.menuItemIcon}><HelpCircle size={16} /></span>
          <span className={styles.menuItemTrailing}>Help &amp; Documentation</span>
          <span className={styles.menuItemExternal}><ExternalLink size={13} /></span>
        </button>
        <button type="button" className={styles.menuItem} disabled={savingToServer}>
          <span className={styles.menuItemIcon}><Info size={16} /></span>
          <span className={styles.menuItemTrailing}>What&apos;s New</span>
          <span className={styles.menuItemExternal}><ExternalLink size={13} /></span>
        </button>
      </div>
    </>
  );
}
