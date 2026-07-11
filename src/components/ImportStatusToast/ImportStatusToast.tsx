import { useEffect } from 'react';
import { CircleCheck, CircleAlert, X } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import styles from './ImportStatusToast.module.css';

export function ImportStatusToast() {
  const importStatus = useSpecStore((s) => s.importStatus);
  const setImportStatus = useSpecStore((s) => s.setImportStatus);

  useEffect(() => {
    if (!importStatus) return;
    const t = setTimeout(() => setImportStatus(null), importStatus.type === 'error' ? 7000 : 4000);
    return () => clearTimeout(t);
  }, [importStatus, setImportStatus]);

  if (!importStatus) return null;

  const Icon = importStatus.type === 'success' ? CircleCheck : CircleAlert;

  return (
    <div className={styles.toast} data-type={importStatus.type} role="status">
      <span className={styles.icon}>
        <Icon size={16} />
      </span>
      <span>{importStatus.message}</span>
      <button type="button" className={styles.closeBtn} onClick={() => setImportStatus(null)}>
        <X size={13} />
      </button>
    </div>
  );
}
