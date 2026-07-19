import { useState } from 'react';
import {
  LayersPlus,
  Layers,
  Upload,
  Download,
  Share2,
  GitBranch,
  SlidersHorizontal,
  FolderX,
  History,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { createNewWorkspace } from '../../lib/newWorkspace';
import { listWorkspaces } from '../../lib/workspaces';
import { openRecentWorkspace } from '../../lib/reopenWorkspace';
import styles from './Topbar.module.css';

interface MoreMenuProps {
  onImport: () => void;
  onExport: () => void;
  onShare: () => void;
}

function formatRelativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function MoreMenu({ onImport, onExport, onShare }: MoreMenuProps) {
  const closeMoreMenu = useAppStore((s) => s.closeMoreMenu);
  const openSettings = useAppStore((s) => s.openSettings);
  const openWorkspaceSettings = useAppStore((s) => s.openWorkspaceSettings);
  const openWorkspaceFromVersionControl = useAppStore((s) => s.openWorkspaceFromVersionControl);
  const closeWorkspace = useAppStore((s) => s.closeWorkspace);
  const hasDocument = useSpecStore((s) => s.hasDocument);
  const [recentExpanded, setRecentExpanded] = useState(false);

  const run = (fn: () => void) => () => {
    fn();
    closeMoreMenu();
  };

  const recentWorkspaces = recentExpanded ? listWorkspaces() : [];

  return (
    <>
      <div className={styles.menuScrim} onClick={closeMoreMenu} />
      <div className={styles.moreMenu} role="menu">
        <button type="button" className={styles.menuItem} onClick={run(createNewWorkspace)}>
          <span className={styles.menuItemIcon}>
            <LayersPlus size={16} />
          </span>
          <span className={styles.menuItemTrailing}>New Workspace</span>
        </button>
        <button type="button" className={styles.menuItem} onClick={run(openWorkspaceFromVersionControl)}>
          <span className={styles.menuItemIcon}>
            <GitBranch size={15} />
          </span>
          <span className={styles.menuItemTrailing}>Workspace from Version Control</span>
        </button>
        <button
          type="button"
          className={styles.menuItem}
          onClick={() => setRecentExpanded((v) => !v)}
          aria-expanded={recentExpanded}
        >
          <span className={styles.menuItemIcon}>
            <History size={15} />
          </span>
          <span className={styles.menuItemTrailing}>Recent Workspaces</span>
          <ChevronRight size={13} className={recentExpanded ? styles.menuChevronOpen : undefined} />
        </button>
        {recentExpanded && (
          <div className={styles.menuSubList}>
            {recentWorkspaces.length === 0 ? (
              <div className={styles.menuEmpty}>No saved workspaces yet</div>
            ) : (
              recentWorkspaces.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={styles.menuSubItem}
                  onClick={run(() => openRecentWorkspace(w.id))}
                >
                  <span className={styles.menuSubItemName}>{w.name}</span>
                  <span className={styles.menuSubItemTime}>{formatRelativeTime(w.savedAt)}</span>
                </button>
              ))
            )}
          </div>
        )}
        <div className={styles.menuDivider} />
        <button type="button" className={styles.menuItem} onClick={run(openWorkspaceSettings)}>
          <span className={styles.menuItemIcon}>
            <SlidersHorizontal size={15} />
          </span>
          <span className={styles.menuItemTrailing}>Workspace Settings</span>
        </button>
        <button type="button" className={styles.menuItem} onClick={openSettings}>
          <span className={styles.menuItemIcon}>
            <Layers size={16} />
          </span>
          <span className={styles.menuItemTrailing}>Settings</span>
        </button>
        <div className={styles.menuDivider} />
        <button type="button" className={styles.menuItem} onClick={run(onImport)}>
          <span className={styles.menuItemIcon}>
            <Upload size={15} />
          </span>
          <span className={styles.menuItemTrailing}>Import</span>
        </button>
        <button type="button" className={styles.menuItem} onClick={run(onExport)}>
          <span className={styles.menuItemIcon}>
            <Download size={15} />
          </span>
          <span className={styles.menuItemTrailing}>Export</span>
        </button>
        <div className={styles.menuDivider} />
        <button type="button" className={styles.menuItem} onClick={run(onShare)}>
          <span className={styles.menuItemIcon}>
            <Share2 size={15} />
          </span>
          <span className={styles.menuItemTrailing}>Share</span>
        </button>
        <div className={styles.menuDivider} />
        <button
          type="button"
          className={styles.menuDangerItem}
          disabled={!hasDocument}
          onClick={run(closeWorkspace)}
        >
          <span className={styles.menuItemIcon}>
            <FolderX size={15} />
          </span>
          <span className={styles.menuItemTrailing}>Close Workspace</span>
        </button>
      </div>
    </>
  );
}
