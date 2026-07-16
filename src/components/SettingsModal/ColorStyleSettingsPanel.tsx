import { Check } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { COLOR_STYLE_CATEGORIES } from '../../lib/colorStyle';
import styles from './ColorStyleSettingsPanel.module.css';

export function ColorStyleSettingsPanel() {
  const colorStyle = useAppStore((s) => s.colorStyle);
  const setColorStyleCategory = useAppStore((s) => s.setColorStyleCategory);

  return (
    <>
      <div>
        <div className={styles.title}>Color Style</div>
        <div className={styles.description}>
          Fine-tune which token types get their own color in the REST Projection editor — the same setting applies
          to YAML and JSON alike, layered on top of whichever Color Scheme is active.
        </div>
      </div>

      <div>
        <div className={styles.sectionLabel}>Token Types</div>
        <div className={styles.checkboxColumn}>
          {COLOR_STYLE_CATEGORIES.map((category) => {
            const checked = colorStyle[category.value];
            return (
              <button
                key={category.value}
                type="button"
                className={styles.checkboxRow}
                onClick={() => setColorStyleCategory(category.value, !checked)}
              >
                <span className={styles.checkbox} data-checked={checked}>
                  {checked && <Check size={13} />}
                </span>
                {category.label}
                <span className={styles.checkboxDesc}>— {category.description}</span>
              </button>
            );
          })}
        </div>
        <div className={styles.hint}>A token type left off falls back to plain text instead of its own color.</div>
      </div>
    </>
  );
}
