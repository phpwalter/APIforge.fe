import { Braces, X } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import { SchemaPanel } from '../SchemaPanel/SchemaPanel';
import { SchemaScalarEditor } from './SchemaScalarEditor';
import { SchemaPropertiesEditor } from './SchemaPropertiesEditor';
import { SchemaContentTypesSection } from './SchemaContentTypesSection';
import { SchemaEmptyState } from './SchemaEmptyState';
import { SchemaCompilePanel } from './SchemaCompilePanel';
import { FieldPickerModal } from '../FieldPickerModal/FieldPickerModal';
import styles from './SchemaDesignerCanvas.module.css';

export function SchemaDesignerCanvas() {
  const schemas = useSpecStore((s) => s.schemas);
  const selectedId = useSpecStore((s) => s.selectedId);
  const setSchemaName = useSpecStore((s) => s.setSchemaName);
  const deleteSchema = useSpecStore((s) => s.deleteSchema);
  const selected = schemas.find((s) => s.id === selectedId);

  return (
    <div className={styles.wrap}>
      <SchemaPanel />

      {selected ? (
        <div className={styles.editorArea}>
          <div className={styles.scroll}>
            <div className={styles.content}>
              <div className={styles.headerRow}>
                <span className={styles.chip} data-scalar={!!selected.scalar}>
                  {selected.scalar ? '#' : <Braces size={15} />}
                </span>
                <input
                  className={styles.nameInput}
                  value={selected.name}
                  onChange={(e) => setSchemaName(selected.id, e.target.value)}
                  placeholder="SchemaName"
                />
                <button
                  type="button"
                  className={styles.deleteBtn}
                  title="Remove"
                  onClick={() => deleteSchema(selected.id)}
                >
                  <X size={12} />
                </button>
              </div>

              {selected.scalar ? (
                <SchemaScalarEditor schema={selected} />
              ) : (
                <>
                  <SchemaPropertiesEditor schema={selected} />
                  <SchemaContentTypesSection schema={selected} />
                </>
              )}
            </div>
          </div>
          <SchemaCompilePanel schema={selected} />
        </div>
      ) : (
        <div className={styles.detail}>
          <SchemaEmptyState />
        </div>
      )}

      <FieldPickerModal />
    </div>
  );
}
