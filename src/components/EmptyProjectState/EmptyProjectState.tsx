import { useRef } from 'react';
import { FileUp, FlaskConical } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import { importOpenApiFile } from '../../lib/importHandler';
import styles from './EmptyProjectState.module.css';

const IMPORT_ACCEPT = '.yaml,.yml,.json,application/json,text/yaml';

export function EmptyProjectState() {
  const loadSampleProject = useSpecStore((s) => s.loadSampleProject);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <FileUp size={26} />
        </div>
        <div className={styles.title}>No API document loaded</div>
        <div className={styles.subtitle}>
          This workspace is empty. Import an OpenAPI document (JSON or YAML) to start designing, or load a sample
          project to explore the interface.
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryBtn} onClick={() => inputRef.current?.click()}>
            <FileUp size={15} />
            Import OpenAPI Document
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={loadSampleProject}>
            <FlaskConical size={15} />
            Load Sample Project
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={IMPORT_ACCEPT}
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void importOpenApiFile(file);
          }}
        />
      </div>
    </div>
  );
}
