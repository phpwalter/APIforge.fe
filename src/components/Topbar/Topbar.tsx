import { useRef } from 'react';
import { Layers, ChevronDown, Undo2, Redo2, Monitor, Moon, Sun, Ellipsis } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { importOpenApiFile } from '../../lib/importHandler';
import { APP_VERSION } from '../../lib/appInfo';
import { SaveBadge } from './SaveBadge';
import { MoreMenu } from './MoreMenu';
import { UserMenu } from './UserMenu';
import styles from './Topbar.module.css';

const IMPORT_ACCEPT = '.yaml,.yml,.json,.xml,application/json,text/yaml,application/xml,text/xml';

function themeTitle(themeMode: string, theme: string): string {
  if (themeMode === 'system') return `Theme: System · following OS (${theme}) — click for Light`;
  if (themeMode === 'light') return 'Theme: Light — click for Dark';
  return 'Theme: Dark — click for System';
}

export function Topbar() {
  const apiTitle = useAppStore((s) => s.apiTitle);
  const apiVersion = useAppStore((s) => s.apiVersion);
  const apiOpenapiVersion = useAppStore((s) => s.apiOpenapiVersion);
  const themeMode = useAppStore((s) => s.themeMode);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const undoStack = useAppStore((s) => s.undoStack);
  const redoStack = useAppStore((s) => s.redoStack);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const moreMenuOpen = useAppStore((s) => s.moreMenuOpen);
  const toggleMoreMenu = useAppStore((s) => s.toggleMoreMenu);
  const openSettings = useAppStore((s) => s.openSettings);
  const openExportModal = useAppStore((s) => s.openExportModal);

  const importInputRef = useRef<HTMLInputElement>(null);

  const cannotUndo = undoStack.length === 0;
  const cannotRedo = redoStack.length === 0;

  const ThemeIcon = themeMode === 'system' ? Monitor : theme === 'dark' ? Moon : Sun;

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>
          <Layers size={19} />
        </span>
        <span className={styles.brandName}>APIforge</span>
        <span className={styles.pill}>{APP_VERSION}</span>
      </div>

      <button type="button" className={styles.projectPill} title="Project settings" onClick={openSettings}>
        <span className={styles.projectPillDot} />
        <span>{apiTitle}</span>
        <span className={styles.projectPillChevron}>
          <ChevronDown size={12} />
        </span>
      </button>

      <div className={styles.versionGroup}>
        <span className={styles.pillMono}>{apiVersion}</span>
        <span className={styles.oasLabel}>OAS {apiOpenapiVersion}</span>
      </div>

      <div className={styles.spacer} />

      <SaveBadge />

      <input
        ref={importInputRef}
        type="file"
        accept={IMPORT_ACCEPT}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void importOpenApiFile(file);
        }}
      />

      <button
        type="button"
        className={styles.iconBtn}
        disabled={cannotUndo}
        title="Undo (Ctrl/Cmd+Z)"
        onClick={undo}
      >
        <Undo2 size={16} />
      </button>
      <button
        type="button"
        className={styles.iconBtn}
        disabled={cannotRedo}
        title="Redo (Ctrl/Cmd+Shift+Z)"
        onClick={redo}
      >
        <Redo2 size={16} />
      </button>

      <button
        type="button"
        className={styles.iconBtn}
        title={themeTitle(themeMode, theme)}
        onClick={toggleTheme}
      >
        <ThemeIcon size={15} />
      </button>

      <div className={styles.menuAnchor}>
        <button type="button" className={styles.iconBtn} title="More actions" onClick={toggleMoreMenu}>
          <Ellipsis size={16} />
        </button>
        {moreMenuOpen && (
          <MoreMenu
            onNewWorkspace={() => {
              /* wired up alongside the workspace-settings modal */
            }}
            onImport={() => importInputRef.current?.click()}
            onExport={openExportModal}
            onToggleCode={() => {
              /* wired up alongside the REST projection tab */
            }}
            onShare={() => {
              /* wired up alongside the share modal */
            }}
          />
        )}
      </div>

      <div className={styles.divider} />

      <UserMenu />
    </header>
  );
}
