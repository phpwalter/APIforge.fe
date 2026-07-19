import { useEffect } from 'react';
import { useAppStore } from '../../state/useAppStore';
import { createNewProject } from '../../lib/newProject';
import styles from './ProjectNameModal.module.css';

/**
 * Shown by requestNewProject() when a document is already loaded — local autosave and Export
 * don't count as saved, only a real server save would (not built yet), so this always guards New
 * Project while anything is open. Unlike ProjectNameModal, this has a real Cancel: Escape and
 * the backdrop both back out safely rather than discarding anything.
 */
export function UnsavedChangesModal() {
  const closeUnsavedChangesPrompt = useAppStore((s) => s.closeUnsavedChangesPrompt);

  const discard = () => {
    closeUnsavedChangesPrompt();
    createNewProject();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeUnsavedChangesPrompt();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeUnsavedChangesPrompt]);

  return (
    <div className={styles.scrim} onClick={closeUnsavedChangesPrompt}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.title}>Unsaved changes</div>
        <div className={styles.description}>
          This project hasn&apos;t been saved to the server yet. Autosave to this browser and exporting to disk
          don&apos;t count — starting a new project will discard it.
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.btnCancel} onClick={closeUnsavedChangesPrompt}>
            Cancel
          </button>
          <button type="button" className={styles.btnDiscard} onClick={discard}>
            Discard &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}
