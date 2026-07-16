import { useAppStore } from '../../state/useAppStore';
import type { CharacterEncoding, LineEnding } from '../../lib/fileEncoding';
import styles from './FileEncodingSettingsPanel.module.css';

export function FileEncodingSettingsPanel() {
  const characterEncoding = useAppStore((s) => s.fileEncodingCharacterEncoding);
  const setCharacterEncoding = useAppStore((s) => s.setFileEncodingCharacterEncoding);
  const lineEnding = useAppStore((s) => s.fileEncodingLineEnding);
  const setLineEnding = useAppStore((s) => s.setFileEncodingLineEnding);
  const insertFinalNewline = useAppStore((s) => s.fileEncodingInsertFinalNewline);
  const setInsertFinalNewline = useAppStore((s) => s.setFileEncodingInsertFinalNewline);

  return (
    <>
      <div>
        <div className={styles.title}>File Encoding</div>
        <div className={styles.description}>
          Controls how REST Projection documents are written — the same setting applies to YAML and JSON alike,
          for both &quot;Copy to clipboard&quot; and downloaded exports.
        </div>
      </div>

      <div>
        <div className={styles.sectionLabel}>Character Encoding</div>
        <div className={styles.radioRow}>
          {(
            [
              ['utf-8', 'UTF-8'],
              ['utf-8-bom', 'UTF-8 with BOM'],
            ] as [CharacterEncoding, string][]
          ).map(([value, label]) => (
            <label key={value} className={styles.radioLabel} onClick={() => setCharacterEncoding(value)}>
              <span className={styles.radioCircle} data-checked={characterEncoding === value}>
                {characterEncoding === value && <span className={styles.radioDot} />}
              </span>
              {label}
            </label>
          ))}
        </div>
        <div className={styles.hint}>
          The byte-order mark only affects downloaded files — it&apos;s never added to clipboard copies, where it
          would just show up as stray text once pasted.
        </div>
      </div>

      <div>
        <div className={styles.sectionLabel}>Line Endings</div>
        <div className={styles.radioRow}>
          {(
            [
              ['lf', 'LF (Unix, macOS)'],
              ['crlf', 'CRLF (Windows)'],
            ] as [LineEnding, string][]
          ).map(([value, label]) => (
            <label key={value} className={styles.radioLabel} onClick={() => setLineEnding(value)}>
              <span className={styles.radioCircle} data-checked={lineEnding === value}>
                {lineEnding === value && <span className={styles.radioDot} />}
              </span>
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className={styles.sectionLabel}>Insert Final Newline</div>
        <div className={styles.highlightRow}>
          <button
            type="button"
            className={styles.highlightPill}
            data-active={insertFinalNewline}
            onClick={() => setInsertFinalNewline(true)}
          >
            On
          </button>
          <button
            type="button"
            className={styles.highlightPill}
            data-active={!insertFinalNewline}
            onClick={() => setInsertFinalNewline(false)}
          >
            Off
          </button>
        </div>
        <div className={styles.hint}>Ensures the document ends with exactly one newline character.</div>
      </div>
    </>
  );
}
