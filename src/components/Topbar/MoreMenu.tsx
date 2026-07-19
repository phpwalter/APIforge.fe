import { useState } from 'react';
import {
  LayersPlus,
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
import { requestNewWorkspace } from '../../lib/newWorkspace';
import { listWorkspaces, formatRelativeTime, deleteWorkspace } from '../../lib/workspaces';
import { openRecentWorkspace } from '../../lib/reopenWorkspace';
import { computeHasSavableContent } from '../../lib/workspaceEligibility';
import styles from './Topbar.module.css';

const RECENT_WORKSPACES_LIMIT = 5;

interface MoreMenuProps {
  onExport: () => void;
  onShare: () => void;
}

export function MoreMenu({ onExport, onShare }: MoreMenuProps) {
  const closeMoreMenu = useAppStore((s) => s.closeMoreMenu);
  const openSettings = useAppStore((s) => s.openSettings);
  const openWorkspaceSettings = useAppStore((s) => s.openWorkspaceSettings);
  const openLoadWorkspaceDialog = useAppStore((s) => s.openLoadWorkspaceDialog);
  const closeWorkspace = useAppStore((s) => s.closeWorkspace);
  const currentWorkspaceName = useAppStore((s) => s.currentWorkspaceName);
  const hasDocument = useSpecStore((s) => s.hasDocument);
  const endpoints = useSpecStore((s) => s.endpoints);
  const schemas = useSpecStore((s) => s.schemas);
  const [recentExpanded, setRecentExpanded] = useState(false);
  const [saveExpanded, setSaveExpanded] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canSaveOrClose = computeHasSavableContent(currentWorkspaceName, endpoints.length, schemas.length);

  const run = (fn: () => void) => () => {
    fn();
    closeMoreMenu();
  };

  const recentWorkspaces = recentExpanded ? listWorkspaces().slice(0, RECENT_WORKSPACES_LIMIT) : [];

  const confirmDelete = (id: string) => {
    deleteWorkspace(id);
    setConfirmDeleteId(null);
  };

  return (
    <>
      <div className={styles.menuScrim} onClick={closeMoreMenu} />
      <div className={styles.moreMenu} role="menu">
        <button type="button" className={styles.menuItem} onClick={run(requestNewWorkspace)}>
          <span className={styles.menuItemIcon}>
            <LayersPlus size={16} />
          </span>
          <span className={styles.menuItemTrailing}>New Workspace</span>
        </button>

        <button type="button" className={styles.menuItem} onClick={run(openLoadWorkspaceDialog)}>
          <span className={styles.menuItemIcon}>
            <FolderOpen size={15} />
          </span>
          <span className={styles.menuItemTrailing}>Load Workspace</span>
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
              recentWorkspaces.map((w) =>
                confirmDeleteId === w.id ? (
                  <div key={w.id} className={styles.menuSubItemRow}>
                    <div className={styles.menuSubItemConfirm}>
                      <span className={styles.menuSubItemConfirmText}>Remove from list?</span>
                      <button
                        type="button"
                        className={styles.menuSubItemConfirmBtnDanger}
                        onClick={() => confirmDelete(w.id)}
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        className={styles.menuSubItemConfirmBtn}
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={w.id} className={styles.menuSubItemRow}>
                    <button
                      type="button"
                      className={styles.menuSubItemOpenBtn}
                      onClick={run(() => openRecentWorkspace(w.id))}
                    >
                      <span className={styles.menuSubItemName}>{w.name}</span>
                      <span className={styles.menuSubItemTime}>{formatRelativeTime(w.savedAt)}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.menuSubItemDeleteBtn}
                      title="Remove from this list — doesn't delete the project"
                      onClick={() => setConfirmDeleteId(w.id)}
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
          disabled={!canSaveOrClose}
          onClick={() => setSaveExpanded((v) => !v)}
          aria-expanded={saveExpanded}
        >
          <span className={styles.menuItemIcon}>
            <Save size={15} />
          </span>
          <span className={styles.menuItemTrailing}>Save Workspace</span>
          <ChevronRight size={13} className={saveExpanded ? styles.menuChevronOpen : undefined} />
        </button>
        {saveExpanded && canSaveOrClose && (
          <div className={styles.menuSubList}>
            <button type="button" className={styles.menuSubItem} disabled>
              <span className={styles.menuSubItemName}>Save to Server</span>
              <span className={styles.menuComingSoon}>Coming soon</span>
            </button>
            <button type="button" className={styles.menuSubItem} onClick={run(onExport)}>
              <span className={styles.menuSubItemName}>Export OpenAPI to disk</span>
            </button>
          </div>
        )}

        <button
          type="button"
          className={styles.menuDangerItem}
          disabled={!hasDocument || !canSaveOrClose}
          onClick={run(closeWorkspace)}
        >
          <span className={styles.menuItemIcon}>
            <FolderX size={15} />
          </span>
          <span className={styles.menuItemTrailing}>Close Workspace</span>
        </button>

        <div className={styles.menuDivider} />
        <button type="button" className={styles.menuItem} onClick={run(openWorkspaceSettings)}>
          <span className={styles.menuItemIcon}>
            <SlidersHorizontal size={15} />
          </span>
          <span className={styles.menuItemTrailing}>Workspace Settings</span>
        </button>

        <div className={styles.menuDivider} />
        <button type="button" className={styles.menuItem} onClick={openSettings}>
          <span className={styles.menuItemIcon}>
            <Layers size={16} />
          </span>
          <span className={styles.menuItemTrailing}>Settings</span>
        </button>

        <div className={styles.menuDivider} />
        <button type="button" className={styles.menuItem} onClick={run(onShare)}>
          <span className={styles.menuItemIcon}>
            <Share2 size={15} />
          </span>
          <span className={styles.menuItemTrailing}>Share</span>
        </button>

        <div className={styles.menuDivider} />
        <button type="button" className={styles.menuItem}>
          <span className={styles.menuItemIcon}>
            <HelpCircle size={16} />
          </span>
          <span className={styles.menuItemTrailing}>Help &amp; Documentation</span>
          <span className={styles.menuItemExternal}>
            <ExternalLink size={13} />
          </span>
        </button>
        <button type="button" className={styles.menuItem}>
          <span className={styles.menuItemIcon}>
            <Info size={16} />
          </span>
          <span className={styles.menuItemTrailing}>What&apos;s New</span>
          <span className={styles.menuItemExternal}>
            <ExternalLink size={13} />
          </span>
        </button>
      </div>
    </>
  );
}
