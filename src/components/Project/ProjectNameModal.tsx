import { useEffect, useState } from 'react';
import { useAppStore } from '../../state/useAppStore';
import styles from './ProjectNameModal.module.css';

/**
 * Shown right after New Project / Import / Load Sample / Project from Version Control. The
 * input starts empty (the suggested name shows only as placeholder text); Save needs 2+
 * characters. Cancel, Escape, and the backdrop all discard the project that was just
 * created/imported via cancelProjectName() rather than locking in a name.
 */
export function ProjectNameModal() {
  const defaultName = useAppStore((s) => s.projectNamePromptDefault);
  const confirmProjectName = useAppStore((s) => s.confirmProjectName);
  const cancelProjectName = useAppStore((s) => s.cancelProjectName);
  const [name, setName] = useState('');
  const canSave = name.trim().length >= 2;

  const confirm = () => {
    if (canSave) confirmProjectName(name);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelProjectName();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancelProjectName]);

  return (
    <div className={styles.scrim} onClick={cancelProjectName}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.title}>New Project</div>
        <div className={styles.description}>Shown in Recent Projects so you can find it again later.</div>
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirm();
          }}
          placeholder={defaultName}
          autoFocus
        />
        <div className={styles.footer}>
          <button type="button" className={styles.btnCancel} onClick={cancelProjectName}>
            Cancel
          </button>
          <button type="button" className={styles.btnSave} disabled={!canSave} onClick={confirm}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
