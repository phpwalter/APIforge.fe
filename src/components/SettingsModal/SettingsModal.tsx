import { useState, type ComponentType } from 'react';
import { Search, X, CircleHelp } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { SETTINGS_CATEGORIES } from './settingsCategories';
import { GeneralSettingsPanel } from './GeneralSettingsPanel';
import { ServersSettingsPanel } from './ServersSettingsPanel';
import { EditorPreferencesSettingsPanel } from './EditorPreferencesSettingsPanel';
import { SecuritySettingsPanel } from './SecuritySettingsPanel';
import { AppearanceSettingsPanel } from './AppearanceSettingsPanel';
import { AboutSettingsPanel } from './AboutSettingsPanel';
import styles from './SettingsModal.module.css';

const SETTINGS_PANELS: Partial<Record<string, ComponentType>> = {
  general: GeneralSettingsPanel,
  servers: ServersSettingsPanel,
  preferences: EditorPreferencesSettingsPanel,
  security: SecuritySettingsPanel,
  appearance: AppearanceSettingsPanel,
  about: AboutSettingsPanel,
};

export function SettingsModal() {
  const closeSettings = useAppStore((s) => s.closeSettings);
  const [search, setSearch] = useState('');
  const [activeKey, setActiveKey] = useState(SETTINGS_CATEGORIES[0].key);

  const q = search.trim().toLowerCase();
  const filtered = SETTINGS_CATEGORIES.filter(
    (c) => !q || c.label.toLowerCase().includes(q) || c.keywords.includes(q),
  );
  const active = filtered.find((c) => c.key === activeKey) ?? filtered[0];

  return (
    <div className={styles.scrim} onClick={closeSettings}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.split}>
          {/* left rail */}
          <div className={styles.rail}>
            <div className={styles.railHead}>
              <div className={styles.railTitle}>Settings</div>
              <div className={styles.searchWrap}>
                <span className={styles.searchIcon}>
                  <Search size={14} />
                </span>
                <input
                  className={styles.searchInput}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search settings…"
                />
              </div>
            </div>
            <div className={styles.navList}>
              {filtered.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    className={styles.navRow}
                    data-active={cat.key === active?.key}
                    onClick={() => setActiveKey(cat.key)}
                  >
                    <span className={styles.navRowIcon}>
                      <Icon size={15} />
                    </span>
                    {cat.label}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className={styles.navEmpty}>No settings match &quot;{search}&quot;.</div>
              )}
            </div>
          </div>

          {/* right pane */}
          <div className={styles.pane}>
            <div className={styles.paneHeader}>
              <span className={styles.paneTitleIcon}>{active && <active.icon size={16} />}</span>
              <div className={styles.paneTitle}>{active?.label ?? 'Settings'}</div>
              <button type="button" className={styles.closeBtn} title="Close" onClick={closeSettings}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.paneBody}>
              {(() => {
                const Panel = active && SETTINGS_PANELS[active.key];
                if (Panel) return <Panel />;
                return (
                  <div className={styles.comingSoonWrap}>
                    <div className={styles.comingSoon}>
                      <div className={styles.comingSoonTitle}>Coming Soon</div>
                      <div className={styles.comingSoonHint}>
                        {active ? `${active.label} settings aren't built yet.` : 'Select a category from the left.'}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.helpBtn} title="Help">
            <CircleHelp size={14} />
          </button>
          <span className={styles.footerSpacer} />
          <button type="button" className={`${styles.btn} ${styles.btnOk}`} onClick={closeSettings}>
            OK
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnCancel}`} onClick={closeSettings}>
            Cancel
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnApply}`} disabled title="Nothing to apply yet">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
