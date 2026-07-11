import { useSpecStore } from '../../state/useSpecStore';
import { SchemaPanel } from '../SchemaPanel/SchemaPanel';
import styles from './SchemaDesignerCanvas.module.css';

export function SchemaDesignerCanvas() {
  const schemas = useSpecStore((s) => s.schemas);
  const selectedId = useSpecStore((s) => s.selectedId);
  const selected = schemas.find((s) => s.id === selectedId);

  return (
    <div className={styles.wrap}>
      <SchemaPanel />
      <div className={styles.detail}>
        {selected ? (
          <span className={styles.selectionChip}>
            <span className={styles.nameLabel}>{selected.name}</span>
            <span>— the field editor (ref / primitive / custom properties) comes next</span>
          </span>
        ) : (
          'Select a schema from the panel to design its properties, or create a new one.'
        )}
      </div>
    </div>
  );
}
