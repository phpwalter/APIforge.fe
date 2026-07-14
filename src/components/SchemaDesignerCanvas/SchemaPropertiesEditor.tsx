import { Plus } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import type { Schema } from '../../types/spec';
import { SchemaFieldRow } from './SchemaFieldRow';
import styles from './SchemaPropertiesEditor.module.css';

interface Props {
  schema: Schema;
}

export function SchemaPropertiesEditor({ schema }: Props) {
  const schemas = useSpecStore((s) => s.schemas);
  const openFieldPicker = useSpecStore((s) => s.openFieldPicker);

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <span className={styles.headerLabel}>Properties</span>
        <button type="button" className={styles.addBtn} title="Add" onClick={() => openFieldPicker(schema.id)}>
          <Plus size={13} />
        </button>
      </div>
      <div className={styles.list}>
        {schema.fields.map((f, i) => (
          <SchemaFieldRow key={f.id} schema={schema} fields={schema.fields} index={i} schemas={schemas} />
        ))}
        {schema.fields.length === 0 && <div className={styles.emptyState}>No properties yet — add one above.</div>}
      </div>
    </div>
  );
}
