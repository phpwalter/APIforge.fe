import { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import { useAppStore } from '../../state/useAppStore';
import { importOpenApiFile } from '../../lib/importHandler';
import { requestNewProject } from '../../lib/newProject';
import { ImportPolicyDialog } from '../Project/ImportPolicyDialog';
import styles from './EmptyProjectState.module.css';

const IMPORT_ACCEPT = '.yaml,.yml,.json,application/json,text/yaml';

export function EmptyProjectState() {
  const loadSampleProject = useSpecStore((s) => s.loadSampleProject);
  const startProject = useAppStore((s) => s.startProject);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const loadSample = () => {
    loadSampleProject();
    startProject('Sample Project');
  };

  return (
    <>
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
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = '';
              if (file) setPendingFile(file);
            }}
          />
        </div>
      </div>

      {pendingFile && (
        <ImportPolicyDialog
          fileName={pendingFile.name}
          busy={importing}
          onCancel={() => setPendingFile(null)}
          onImport={(mode) => {
            setImporting(true);
            void importOpenApiFile(pendingFile, mode).finally(() => {
              setImporting(false);
              setPendingFile(null);
            });
          }}
        />
      )}
    </>
  );
}
