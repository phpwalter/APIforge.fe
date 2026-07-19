import { useEffect, useState } from 'react';
import { useAppStore } from '../../state/useAppStore';
import styles from './ProjectNameModal.module.css';

/**
 * Shown right after New Project / Import / Load Sample / Project from Version Control — the
 * project already has real content by the time this appears, so there's no "cancel" here, only
 * "accept this name" (Save, Escape, or the backdrop all confirm with whatever's typed, falling
 * back to the suggested default).
 */
export function ProjectNameModal() {
  const defaultName = useAppStore((s) => s.projectNamePromptDefault);
  const confirmProjectName = useAppStore((s) => s.confirmProjectName);
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  const confirm = () => confirmProjectName(name);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') confirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  return (
    <div className={styles.scrim} onClick={confirm}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.title}>Name this project</div>
        <div className={styles.description}>Shown in Recent Projects so you can find it again later.</div>
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirm();
          }}
          placeholder="Project name"
          autoFocus
        />
        <div className={styles.footer}>
          <button type="button" className={styles.btnSave} onClick={confirm}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
