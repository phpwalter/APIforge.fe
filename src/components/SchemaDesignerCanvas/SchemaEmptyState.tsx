import { Braces, Plus } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import styles from './SchemaEmptyState.module.css';

export function SchemaEmptyState() {
  const addSchema = useSpecStore((s) => s.addSchema);

  return (
    <div className={styles.wrap}>
      <div className={styles.glyph}>
        <Braces size={30} />
      </div>
      <div className={styles.title}>No Schema Reference Selected</div>
      <div className={styles.subtitle}>
        Select an object schema reference from the list sidebar to design its properties and fields, or create a
        brand new schema.
      </div>
      <button type="button" className={styles.createBtn} onClick={addSchema}>
        <Plus size={15} /> Create New Schema
      </button>
    </div>
  );
}
