import { useRef } from 'react';
import { FileUp } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import { useAppStore } from '../../state/useAppStore';
import { importOpenApiFile } from '../../lib/importHandler';
import { requestNewProject } from '../../lib/newProject';
import styles from './EmptyProjectState.module.css';

const IMPORT_ACCEPT = '.yaml,.yml,.json,application/json,text/yaml';

export function EmptyProjectState() {
  const loadSampleProject = useSpecStore((s) => s.loadSampleProject);
  const startProject = useAppStore((s) => s.startProject);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadSample = () => {
    loadSampleProject();
    startProject('Sample Project');
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <FileUp size={26} />
        </div>
        <div className={styles.title}>No API document loaded</div>
        <div className={styles.subtitle}>
          This project is empty.{' '}
          <button type="button" className={styles.link} onClick={requestNewProject}>
            Create a new project
          </button>
          , <button type="button" className={styles.link} onClick={() => inputRef.current?.click()}>
            import an OpenAPI document
          </button>{' '}
          (JSON or YAML), or{' '}
          <button type="button" className={styles.link} onClick={loadSample}>
            load a sample project
          </button>{' '}
          to explore the interface.
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
