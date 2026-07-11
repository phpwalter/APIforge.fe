import { useAppStore } from '../../state/useAppStore';
import styles from './Topbar.module.css';

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

export function SaveBadge() {
  const saveState = useAppStore((s) => s.saveState);
  const lastSavedAt = useAppStore((s) => s.lastSavedAt);

  const label =
    saveState === 'saving' ? 'Saving…' : saveState === 'unsaved' ? 'Unsaved changes' : 'Saved';

  const title =
    saveState === 'saved'
      ? lastSavedAt
        ? `Saved to this browser · ${formatTime(lastSavedAt)}`
        : 'Saved'
      : saveState === 'saving'
        ? 'Saving your changes…'
        : 'Changes not yet saved — saves automatically';

  return (
    <span className={styles.saveBadge} title={title}>
      <span className={styles.saveBadgeDot} data-state={saveState} />
      {label}
    </span>
  );
}
