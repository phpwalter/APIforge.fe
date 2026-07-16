import { lazy, Suspense } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { resolveMonacoTheme } from '../../lib/colorScheme';
import { BACKGROUND_ITEM, COLOR_STYLE_CATEGORIES, DEFAULT_ITEM_COLOR, type ColorStyleItem } from '../../lib/colorStyle';
import styles from './ColorStyleSettingsPanel.module.css';

// Monaco is a large dependency — only pull it into a chunk once this panel actually renders.
const ColorStylePreview = lazy(() =>
  import('./ColorStylePreview').then((m) => ({ default: m.ColorStylePreview })),
);

export function ColorStyleSettingsPanel() {
  const theme = useAppStore((s) => s.theme);
  const editorColorScheme = useAppStore((s) => s.editorColorScheme);
  const colorStyle = useAppStore((s) => s.colorStyle);
  const setColorStyleCategory = useAppStore((s) => s.setColorStyleCategory);
  const colorStyleCustomColors = useAppStore((s) => s.colorStyleCustomColors);
  const setColorStyleCustomColor = useAppStore((s) => s.setColorStyleCustomColor);

  const monacoTheme = resolveMonacoTheme(editorColorScheme, theme);
  const customColorsForTheme = colorStyleCustomColors[monacoTheme];

  const colorFor = (item: ColorStyleItem) => customColorsForTheme[item] ?? DEFAULT_ITEM_COLOR[monacoTheme][item];

  return (
    <>
      <div>
        <div className={styles.title}>Color Style</div>
        <div className={styles.description}>
          Fine-tune which token types get their own color in the REST Projection editor, and pick custom colors for
          them — the same setting applies to YAML and JSON alike. Custom colors are saved per Color Scheme, so this
          is editing the palette for <strong>{monacoTheme}</strong> specifically.
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.leftColumn}>
          <div className={styles.sectionLabel}>Token Types</div>
          <div className={styles.itemColumn}>
            {COLOR_STYLE_CATEGORIES.map((category) => {
              const checked = colorStyle[category.value];
              const hasCustom = customColorsForTheme[category.value] != null;
              return (
                <div key={category.value} className={styles.itemRow}>
                  <button
                    type="button"
                    className={styles.checkboxRow}
                    onClick={() => setColorStyleCategory(category.value, !checked)}
                  >
                    <span className={styles.checkbox} data-checked={checked}>
                      {checked && <Check size={13} />}
                    </span>
                    {category.label}
                    <span className={styles.itemDesc}>— {category.description}</span>
                  </button>
                  <div className={styles.swatchGroup}>
                    {hasCustom && (
                      <button
                        type="button"
                        className={styles.resetBtn}
                        title={`Reset ${category.label} to the ${monacoTheme} theme default`}
                        onClick={() => setColorStyleCustomColor(monacoTheme, category.value, null)}
                      >
                        <RotateCcw size={12} />
                      </button>
                    )}
                    <input
                      type="color"
                      className={styles.swatch}
                      disabled={!checked}
                      title={checked ? `${category.label} color` : `${category.label} is off — turn it on to color it`}
                      value={colorFor(category.value)}
                      onChange={(e) => setColorStyleCustomColor(monacoTheme, category.value, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}

            <div className={styles.itemRow}>
              <div className={styles.plainRowLabel}>
                {BACKGROUND_ITEM.label}
                <span className={styles.itemDesc}>— {BACKGROUND_ITEM.description}</span>
              </div>
              <div className={styles.swatchGroup}>
                {customColorsForTheme.background != null && (
                  <button
                    type="button"
                    className={styles.resetBtn}
                    title={`Reset Background to the ${monacoTheme} theme default`}
                    onClick={() => setColorStyleCustomColor(monacoTheme, 'background', null)}
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
                <input
                  type="color"
                  className={styles.swatch}
                  title="Background color"
                  value={colorFor('background')}
                  onChange={(e) => setColorStyleCustomColor(monacoTheme, 'background', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className={styles.hint}>A token type left off falls back to plain text instead of its own color.</div>
        </div>

        <div className={styles.rightColumn}>
          <Suspense fallback={<div className={styles.previewLoading}>Loading preview…</div>}>
            <ColorStylePreview
              monacoTheme={monacoTheme}
              colorStylePrefs={colorStyle}
              colorStyleCustomColors={customColorsForTheme}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
