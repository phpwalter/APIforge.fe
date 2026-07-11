import { LayersPlus, Layers, Upload, Download, Code, Share2 } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import styles from './Topbar.module.css';

interface MoreMenuProps {
  onNewWorkspace: () => void;
  onImport: () => void;
  onExport: () => void;
  onToggleCode: () => void;
  onShare: () => void;
}

export function MoreMenu({ onNewWorkspace, onImport, onExport, onToggleCode, onShare }: MoreMenuProps) {
  const closeMoreMenu = useAppStore((s) => s.closeMoreMenu);
  const openSettings = useAppStore((s) => s.openSettings);

  const run = (fn: () => void) => () => {
    fn();
    closeMoreMenu();
  };

  return (
    <>
      <div className={styles.menuScrim} onClick={closeMoreMenu} />
      <div className={styles.moreMenu} role="menu">
        <button type="button" className={styles.menuItem} onClick={run(onNewWorkspace)}>
          <span className={styles.menuItemIcon}>
            <LayersPlus size={16} />
          </span>
          <span className={styles.menuItemTrailing}>New Workspace</span>
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
        <button type="button" className={styles.menuItem} onClick={run(onToggleCode)}>
          <span className={styles.menuItemIcon}>
            <Code size={15} />
          </span>
          <span className={styles.menuItemTrailing}>Code</span>
        </button>
        <button type="button" className={styles.menuItem} onClick={run(onShare)}>
          <span className={styles.menuItemIcon}>
            <Share2 size={15} />
          </span>
          <span className={styles.menuItemTrailing}>Share</span>
        </button>
      </div>
    </>
  );
}
