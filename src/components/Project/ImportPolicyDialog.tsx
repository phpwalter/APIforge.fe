import { useEffect, useState } from 'react';
import type { ImportPolicyMode } from '../../lib/importHandler';
import styles from './ImportPolicyDialog.module.css';

interface ImportPolicyDialogProps {
  fileName: string;
  busy?: boolean;
  onCancel: () => void;
  onImport: (mode: ImportPolicyMode) => void;
}

export function ImportPolicyDialog({ fileName, busy = false, onCancel, onImport }: ImportPolicyDialogProps) {
  const [mode, setMode] = useState<ImportPolicyMode>('preserve');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [busy, onCancel]);

  return (
    <div
      className={styles.scrim}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="import-policy-title">
        <header className={styles.header}>
          <div>
            <h2 id="import-policy-title">Import OpenAPI Document</h2>
            <p>{fileName}</p>
          </div>
        </header>

        <div className={styles.body}>
          <p className={styles.prompt}>How should APIForge handle Method Settings?</p>

          <label className={styles.option} data-selected={mode === 'preserve'}>
            <input
              type="radio"
              name="import-policy"
              value="preserve"
              checked={mode === 'preserve'}
              disabled={busy}
              onChange={() => setMode('preserve')}
            />
            <span>
              <strong>Preserve imported document</strong>
              <small>
                Load the API definition as provided. Missing APIForge response-policy items are not added.
              </small>
            </span>
          </label>

          <label className={styles.option} data-selected={mode === 'apply-method-policies'}>
            <input
              type="radio"
              name="import-policy"
              value="apply-method-policies"
              checked={mode === 'apply-method-policies'}
              disabled={busy}
              onChange={() => setMode('apply-method-policies')}
            />
            <span>
              <strong>Apply APIForge Method Settings</strong>
              <small>
                Add missing enabled Required or Default response codes to operations that already exist. Existing
                methods and custom responses are preserved.
              </small>
            </span>
          </label>

          <p className={styles.note}>
            APIForge never writes these changes back to the source file. Missing HTTP methods are not created.
          </p>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.cancel} disabled={busy} onClick={onCancel}>Cancel</button>
          <button type="button" className={styles.importButton} disabled={busy} onClick={() => onImport(mode)}>
            {busy ? 'Importing…' : 'Import'}
          </button>
        </footer>
      </section>
    </div>
  );
}
