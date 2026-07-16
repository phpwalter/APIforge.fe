import { lazy, Suspense, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { COLOR_SCHEME_OPTIONS, MONACO_THEME_IDS, resolveMonacoTheme, type MonacoThemeId } from '../../lib/colorScheme';
import { BACKGROUND_ITEM, COLOR_STYLE_CATEGORIES, DEFAULT_ITEM_COLOR, type ColorStyleItem } from '../../lib/colorStyle';
import styles from './ColorStyleSettingsPanel.module.css';

// Monaco is a large dependency — only pull it into a chunk once this panel actually renders.
const ColorStylePreview = lazy(() =>
  import('./ColorStylePreview').then((m) => ({ default: m.ColorStylePreview })),
);

type EditTarget = MonacoThemeId | 'all';

// Which palette these color edits apply to — independent of Settings :: Color Scheme, so you can
// customize any theme (or all of them at once) without switching what's actually active.
const EDIT_TARGET_OPTIONS: { value: EditTarget; label: string }[] = [
  ...COLOR_SCHEME_OPTIONS.filter((o) => o.value !== 'auto').map((o) => ({ value: o.value as MonacoThemeId, label: o.label })),
  { value: 'all', label: 'All Color Schemes' },
];

export function ColorStyleSettingsPanel() {
  const theme = useAppStore((s) => s.theme);
  const editorColorScheme = useAppStore((s) => s.editorColorScheme);
  const colorStyle = useAppStore((s) => s.colorStyle);
  const setColorStyleCategory = useAppStore((s) => s.setColorStyleCategory);
  const colorStyleCustomColors = useAppStore((s) => s.colorStyleCustomColors);
  const setColorStyleCustomColor = useAppStore((s) => s.setColorStyleCustomColor);
  const setColorStyleCustomColorAll = useAppStore((s) => s.setColorStyleCustomColorAll);
  const resetColorStyle = useAppStore((s) => s.resetColorStyle);

  // The app's real, currently-active theme — the starting selection, and what "All Color Schemes"
  // previews with (Monaco can only render one theme at a time).
  const activeTheme = resolveMonacoTheme(editorColorScheme, theme);
  const [editTarget, setEditTarget] = useState<EditTarget>(activeTheme);
  const isAll = editTarget === 'all';
  const previewTheme = isAll ? activeTheme : editTarget;
  const customColorsForTheme = colorStyleCustomColors[previewTheme];

  const colorFor = (item: ColorStyleItem) => customColorsForTheme[item] ?? DEFAULT_ITEM_COLOR[previewTheme][item];
  const hasCustom = (item: ColorStyleItem) =>
    isAll ? MONACO_THEME_IDS.some((t) => colorStyleCustomColors[t][item] != null) : customColorsForTheme[item] != null;
  const setColor = (item: ColorStyleItem, color: string | null) =>
    isAll ? setColorStyleCustomColorAll(item, color) : setColorStyleCustomColor(editTarget, item, color);

  const targetLabel = EDIT_TARGET_OPTIONS.find((o) => o.value === editTarget)?.label ?? editTarget;

  return (
    <>
      <div>
        <div className={styles.title}>Color Style</div>
        <div className={styles.description}>
          Fine-tune which token types get their own color in the REST Projection editor, and pick custom colors for
          them — the same setting applies to YAML and JSON alike. Custom colors are saved per Color Scheme, so this
          is editing the palette for <strong>{targetLabel}</strong>.
        </div>
      </div>

      <div className={styles.colorSchemeField}>
        <div className={styles.fieldLabel}>Color Scheme</div>
        <select
          className={styles.select}
          value={editTarget}
          onChange={(e) => setEditTarget(e.target.value as EditTarget)}
        >
          {EDIT_TARGET_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.layout}>
        <div className={styles.leftColumn}>
          <div className={styles.sectionRow}>
            <div className={styles.sectionLabel}>Token Types</div>
            <button
              type="button"
              className={styles.resetAllBtn}
              title={`Reset all Color Style settings to the ${targetLabel} default${isAll ? 's' : ''}`}
              onClick={() => resetColorStyle(editTarget)}
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>
          <div className={styles.itemColumn}>
            {COLOR_STYLE_CATEGORIES.map((category) => {
              const checked = colorStyle[category.value];
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
                    {hasCustom(category.value) && (
                      <button
                        type="button"
                        className={styles.resetBtn}
                        title={`Reset ${category.label} to the ${targetLabel} default${isAll ? 's' : ''}`}
                        onClick={() => setColor(category.value, null)}
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
                      onChange={(e) => setColor(category.value, e.target.value)}
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
                {hasCustom('background') && (
                  <button
                    type="button"
                    className={styles.resetBtn}
                    title={`Reset Background to the ${targetLabel} default${isAll ? 's' : ''}`}
                    onClick={() => setColor('background', null)}
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
                <input
                  type="color"
                  className={styles.swatch}
                  title="Background color"
                  value={colorFor('background')}
                  onChange={(e) => setColor('background', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className={styles.hint}>A token type left off falls back to plain text instead of its own color.</div>
        </div>

        <div className={styles.rightColumn}>
          <Suspense fallback={<div className={styles.previewLoading}>Loading preview…</div>}>
            <ColorStylePreview
              monacoTheme={previewTheme}
              colorStylePrefs={colorStyle}
              colorStyleCustomColors={customColorsForTheme}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
