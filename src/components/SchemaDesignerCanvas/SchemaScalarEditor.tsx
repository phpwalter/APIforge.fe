import { useSpecStore } from '../../state/useSpecStore';
import type { Schema } from '../../types/spec';
import { FieldActionSlot } from '../../lib/plugins/FieldActionSlot';
import styles from './SchemaScalarEditor.module.css';

interface Props {
  schema: Schema;
}

export function SchemaScalarEditor({ schema }: Props) {
  const setScalarDescription = useSpecStore((s) => s.setScalarDescription);

  return (
    <div className={styles.wrap}>
      <div className={styles.hint}>
        Primitive schema — a reusable scalar type, referenced with{' '}
        <span className={styles.mono}>$ref</span> instead of nested properties.
      </div>
      <div className={styles.fields}>
        <div>
          <div className={styles.label}>Type</div>
          <div className={styles.readonlyBox}>{schema.scalarType || 'string'}</div>
        </div>
        <div>
          <div className={styles.label}>Format</div>
          <div className={styles.readonlyBox}>{schema.scalarFormat || ''}</div>
        </div>
        {schema.scalarPrimitiveKey && (
          <div className={styles.libraryNotice}>
            Backed by the <span className={styles.mono}>{schema.scalarPrimitiveKey}</span> library primitive —
            type and format are locked.
          </div>
        )}
        <div>
          <div className={styles.label}>Description</div>
          <div className={styles.descRow}>
            <textarea
              className={styles.textarea}
              value={schema.scalarDescription || ''}
              onChange={(e) => setScalarDescription(schema.id, e.target.value)}
              placeholder="What this type represents…"
              rows={2}
            />
            <FieldActionSlot
              slot="schemaDescription"
              value={schema.scalarDescription || ''}
              onChange={(v) => setScalarDescription(schema.id, v)}
              hints={{ schemaName: schema.name }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
