import { Check } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import type { IndentSize, IndentStyle } from '../../lib/formatting';
import styles from './FormattingSettingsPanel.module.css';

export function FormattingSettingsPanel() {
  const indentSize = useAppStore((s) => s.formattingIndentSize);
  const setIndentSize = useAppStore((s) => s.setFormattingIndentSize);
  const indentStyle = useAppStore((s) => s.formattingIndentStyle);
  const setIndentStyle = useAppStore((s) => s.setFormattingIndentStyle);
  const wordWrap = useAppStore((s) => s.formattingWordWrap);
  const setWordWrap = useAppStore((s) => s.setFormattingWordWrap);
  const trimTrailingWhitespace = useAppStore((s) => s.formattingTrimTrailingWhitespace);
  const setTrimTrailingWhitespace = useAppStore((s) => s.setFormattingTrimTrailingWhitespace);
  const removeBlankLines = useAppStore((s) => s.formattingRemoveBlankLines);
  const setRemoveBlankLines = useAppStore((s) => s.setFormattingRemoveBlankLines);

  return (
    <>
      <div>
        <div className={styles.title}>Formatting</div>
        <div className={styles.description}>
          Controls indentation and line wrapping in the REST Projection editor — the same setting applies to YAML
          and JSON alike.
        </div>
      </div>

      <div>
        <div className={styles.sectionLabel}>Indent Size</div>
        <div className={styles.radioRow}>
          {(
            [
              [2, '2 spaces'],
              [4, '4 spaces'],
            ] as [IndentSize, string][]
          ).map(([value, label]) => (
            <label key={value} className={styles.radioLabel} onClick={() => setIndentSize(value)}>
              <span className={styles.radioCircle} data-checked={indentSize === value}>
                {indentSize === value && <span className={styles.radioDot} />}
              </span>
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className={styles.sectionLabel}>Indent Style</div>
        <div className={styles.radioRow}>
          {(
            [
              ['spaces', 'Spaces'],
              ['tabs', 'Tabs'],
            ] as [IndentStyle, string][]
          ).map(([value, label]) => (
            <label key={value} className={styles.radioLabel} onClick={() => setIndentStyle(value)}>
              <span className={styles.radioCircle} data-checked={indentStyle === value}>
                {indentStyle === value && <span className={styles.radioDot} />}
              </span>
              {label}
            </label>
          ))}
        </div>
        <div className={styles.hint}>
          YAML always indents with spaces — tab indentation isn&apos;t valid YAML syntax. Tabs only applies to the
          JSON view (and to typing in either editor).
        </div>
      </div>

      <div>
        <div className={styles.sectionLabel}>Word Wrap</div>
        <div className={styles.highlightRow}>
          <button
            type="button"
            className={styles.highlightPill}
            data-active={wordWrap}
            onClick={() => setWordWrap(true)}
          >
            On
          </button>
          <button
            type="button"
            className={styles.highlightPill}
            data-active={!wordWrap}
            onClick={() => setWordWrap(false)}
          >
            Off
          </button>
        </div>
        <div className={styles.hint}>Wraps long lines to fit the editor width instead of scrolling horizontally.</div>
      </div>

      <div>
        <div className={styles.sectionLabel}>Clean Up on Copy &amp; Export</div>
        <div className={styles.checkboxColumn}>
          <button
            type="button"
            className={styles.checkboxRow}
            onClick={() => setTrimTrailingWhitespace(!trimTrailingWhitespace)}
          >
            <span className={styles.checkbox} data-checked={trimTrailingWhitespace}>
              {trimTrailingWhitespace && <Check size={13} />}
            </span>
            Remove spaces at end of line
          </button>
          <button type="button" className={styles.checkboxRow} onClick={() => setRemoveBlankLines(!removeBlankLines)}>
            <span className={styles.checkbox} data-checked={removeBlankLines}>
              {removeBlankLines && <Check size={13} />}
            </span>
            Remove blank lines
          </button>
        </div>
        <div className={styles.hint}>
          Applied when copying to the clipboard or downloading an export — never to the live editor content while
          you&apos;re editing.
        </div>
      </div>
    </>
  );
}
