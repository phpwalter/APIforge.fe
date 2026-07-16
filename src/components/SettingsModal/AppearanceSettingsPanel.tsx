import { Sun, Moon } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import styles from './AppearanceSettingsPanel.module.css';

export function AppearanceSettingsPanel() {
  const themeMode = useAppStore((s) => s.themeMode);
  const theme = useAppStore((s) => s.theme);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const highlightingByFormat = useAppStore((s) => s.restProjectionHighlighting);
  const setHighlightingForFormat = useAppStore((s) => s.setRestProjectionHighlighting);
  const allHighlightingOn = highlightingByFormat.yaml && highlightingByFormat.json && highlightingByFormat.xml;
  const allHighlightingOff = !highlightingByFormat.yaml && !highlightingByFormat.json && !highlightingByFormat.xml;
  const setAllHighlighting = (v: boolean) => {
    setHighlightingForFormat('yaml', v);
    setHighlightingForFormat('json', v);
    setHighlightingForFormat('xml', v);
  };

  const syncChecked = themeMode === 'system';
  const manualChecked = !syncChecked;

  return (
    <>
      <div>
        <div className={styles.title}>Themes</div>
        <div className={styles.description}>
          Personalize your workspace with a Day and Night theme. Sync with your system to switch automatically, or
          set one manually.
        </div>
      </div>

      <div>
        <div className={styles.sectionLabel} style={{ marginBottom: 10 }}>
          Theme selection
        </div>
        <div className={styles.radioRow}>
          <label className={styles.radioLabel} onClick={() => setThemeMode('system')}>
            <span className={styles.radioCircle} data-checked={syncChecked}>
              {syncChecked && <span className={styles.radioDot} />}
            </span>
            Sync with system
          </label>
          <label className={styles.radioLabel} onClick={() => setThemeMode(theme)}>
            <span className={styles.radioCircle} data-checked={manualChecked}>
              {manualChecked && <span className={styles.radioDot} />}
            </span>
            Manual
          </label>
        </div>
      </div>

      <div className={styles.themeGrid}>
        <div>
          <div className={styles.themeHeaderRow} title="Switch to Day theme" onClick={() => setThemeMode('light')}>
            <span className={styles.themeIconBox}>
              <Sun size={14} />
            </span>
            <span className={styles.themeLabel}>Day Theme</span>
            {theme === 'light' && <span className={styles.activeBadge}>ACTIVE</span>}
          </div>
          <div className={styles.previewOuter} style={{ background: '#f4f4f6' }}>
            <div className={styles.previewHeader} style={{ background: '#e6e6ea' }}>
              <div className={styles.previewTabBar} style={{ width: 26, background: '#d3d3d8' }} />
              <div className={styles.previewTabBar} style={{ width: 18, background: '#d3d3d8' }} />
              <div className={styles.previewSpacer} />
              <span className={styles.previewDot} style={{ background: '#d3d3d8' }} />
              <span className={styles.previewDot} style={{ background: '#e08a4a' }} />
              <span className={styles.previewDot} style={{ background: '#d3d3d8' }} />
            </div>
            <div className={styles.previewBody}>
              <div className={styles.previewTitleBar} style={{ background: '#d3d3d8' }} />
              <div className={styles.previewRow}>
                <div className={styles.previewInputBox} style={{ borderColor: '#d3d3d8' }} />
                <div className={styles.previewButtonBox} style={{ background: '#4a82d8' }} />
              </div>
              <div className={styles.previewRow}>
                <div className={styles.previewBar} style={{ width: 28, background: '#e08a4a' }} />
                <div className={styles.previewBar} style={{ width: 22, background: '#d3d3d8' }} />
                <div className={styles.previewBar} style={{ width: 18, background: '#d3d3d8' }} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className={styles.themeHeaderRow} title="Switch to Night theme" onClick={() => setThemeMode('dark')}>
            <span className={styles.themeIconBox}>
              <Moon size={14} />
            </span>
            <span className={styles.themeLabel}>Night Theme</span>
            {theme === 'dark' && <span className={styles.activeBadge}>ACTIVE</span>}
          </div>
          <div className={styles.previewOuter} style={{ background: '#1b1b1f' }}>
            <div className={styles.previewHeader} style={{ background: '#26262b' }}>
              <div className={styles.previewTabBar} style={{ width: 26, background: '#3a3a40' }} />
              <div className={styles.previewTabBar} style={{ width: 18, background: '#3a3a40' }} />
              <div className={styles.previewSpacer} />
              <span className={styles.previewDot} style={{ background: '#3a3a40' }} />
              <span className={styles.previewDot} style={{ background: '#e08a4a' }} />
              <span className={styles.previewDot} style={{ background: '#3a3a40' }} />
            </div>
            <div className={styles.previewBody}>
              <div className={styles.previewTitleBar} style={{ background: '#3a3a40' }} />
              <div className={styles.previewRow}>
                <div className={styles.previewInputBox} style={{ borderColor: '#3a3a40' }} />
                <div className={styles.previewButtonBox} style={{ background: '#4a82d8' }} />
              </div>
              <div className={styles.previewRow}>
                <div className={styles.previewBar} style={{ width: 28, background: '#e08a4a' }} />
                <div className={styles.previewBar} style={{ width: 22, background: '#3a3a40' }} />
                <div className={styles.previewBar} style={{ width: 18, background: '#3a3a40' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className={styles.sectionLabel}>Language</div>
        <div className={styles.languagePill}>
          English <span className={styles.languagePillFaint}>· more languages coming soon</span>
        </div>
      </div>

      <div>
        <div className={styles.sectionLabel}>Syntax Highlighting</div>
        <div className={styles.highlightRow}>
          <button
            type="button"
            className={styles.highlightPill}
            data-active={allHighlightingOn}
            onClick={() => setAllHighlighting(true)}
          >
            On
          </button>
          <button
            type="button"
            className={styles.highlightPill}
            data-active={allHighlightingOff}
            onClick={() => setAllHighlighting(false)}
          >
            Off
          </button>
        </div>
        <div className={styles.highlightHint}>
          Colors keys, strings, numbers &amp; punctuation in the REST Projection YAML/JSON/XML views. Each format
          also has its own toggle in the REST Projection toolbar.
        </div>
      </div>
    </>
  );
}
