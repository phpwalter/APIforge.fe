import { useRef } from 'react';
import { FileUp, FlaskConical } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import { useAppStore } from '../../state/useAppStore';
import { importOpenApiFile } from '../../lib/importHandler';
import styles from './EmptyProjectState.module.css';

const IMPORT_ACCEPT = '.yaml,.yml,.json,.xml,application/json,text/yaml,application/xml,text/xml';

export function EmptyProjectState() {
  const loadSampleProject = useSpecStore((s) => s.loadSampleProject);
  const startWorkspace = useAppStore((s) => s.startWorkspace);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadSample = () => {
    loadSampleProject();
    startWorkspace('Sample Project');
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <FileUp size={26} />
        </div>
        <div className={styles.title}>No API document loaded</div>
        <div className={styles.subtitle}>
          This workspace is empty. Import an OpenAPI document (JSON, YAML, or XML) to start designing, or load a
          sample project to explore the interface.
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryBtn} onClick={() => inputRef.current?.click()}>
            <FileUp size={15} />
            Import OpenAPI Document
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={loadSample}>
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
