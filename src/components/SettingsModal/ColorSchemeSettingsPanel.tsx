import { useAppStore } from '../../state/useAppStore';
import { COLOR_SCHEME_OPTIONS } from '../../lib/colorScheme';
import styles from './ColorSchemeSettingsPanel.module.css';

export function ColorSchemeSettingsPanel() {
  const colorScheme = useAppStore((s) => s.editorColorScheme);
  const setColorScheme = useAppStore((s) => s.setEditorColorScheme);

  return (
    <>
      <div>
        <div className={styles.title}>Color Scheme</div>
        <div className={styles.description}>
          Sets the REST Projection editor&apos;s own color theme — the same setting applies to YAML and JSON alike,
          independent of the app&apos;s Day/Night theme unless set to Auto.
        </div>
      </div>

      <div>
        <div className={styles.sectionLabel}>Theme</div>
        <div className={styles.optionList} role="radiogroup" aria-label="Color Scheme">
          {COLOR_SCHEME_OPTIONS.map((option) => {
            const active = colorScheme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={styles.option}
                data-active={active}
                onClick={() => setColorScheme(option.value)}
              >
                <span className={styles.radioCircle} data-checked={active}>
                  {active && <span className={styles.radioDot} />}
                </span>
                <span className={styles.optionBody}>
                  <div className={styles.optionLabel}>{option.label}</div>
                  <div className={styles.optionDesc}>{option.description}</div>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
