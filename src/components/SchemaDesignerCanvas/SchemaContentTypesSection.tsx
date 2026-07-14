import { X } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import { CONTENT_TYPE_OPTIONS } from '../../lib/responseClass';
import { fieldsToExampleValue, formatExampleForContentType } from '../../lib/schemaExample';
import type { Schema } from '../../types/spec';
import styles from './SchemaContentTypesSection.module.css';

interface Props {
  schema: Schema;
}

export function SchemaContentTypesSection({ schema }: Props) {
  const schemas = useSpecStore((s) => s.schemas);
  const toggleSchemaContentType = useSpecStore((s) => s.toggleSchemaContentType);

  const availableContentTypes = CONTENT_TYPE_OPTIONS.filter((ct) => !schema.contentTypes.includes(ct));
  const exampleValue = fieldsToExampleValue(schema, schemas);

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <span className={styles.headerLabel}>Content types</span>
      </div>
      <div className={styles.ctChipsWrap}>
        {schema.contentTypes.map((ct) => (
          <span key={ct} className={styles.ctChip}>
            {ct}
            <button
              type="button"
              className={styles.ctChipRemove}
              title="Remove content-type"
              onClick={() => toggleSchemaContentType(schema.id, ct)}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        {availableContentTypes.length > 0 && (
          <select
            className={styles.ctAddSelect}
            value=""
            title="Add a content type"
            onChange={(e) => {
              if (e.target.value) toggleSchemaContentType(schema.id, e.target.value);
            }}
          >
            <option value="">+ Add type</option>
            {availableContentTypes.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.examplesList}>
        {schema.contentTypes.map((ct) => (
          <div key={ct}>
            <div className={styles.exampleHeadRow}>
              <span className={styles.exampleCtLabel}>{ct}</span>
              <span className={styles.exampleAutoTag}>auto-generated from properties</span>
              <span className={styles.exampleSpacer} />
              <button
                type="button"
                className={styles.exampleRemoveBtn}
                title="Remove content type"
                onClick={() => toggleSchemaContentType(schema.id, ct)}
              >
                <X size={12} />
              </button>
            </div>
            <pre className={styles.exampleCode}>{formatExampleForContentType(exampleValue, ct, schema.name)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
