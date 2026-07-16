import { useState, type ComponentType } from 'react';
import { Search, X, CircleHelp, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { SETTINGS_CATEGORIES, type SettingsCategory } from './settingsCategories';
import { GeneralSettingsPanel } from './GeneralSettingsPanel';
import { ServersSettingsPanel } from './ServersSettingsPanel';
import { EditorPreferencesSettingsPanel } from './EditorPreferencesSettingsPanel';
import { SecuritySettingsPanel } from './SecuritySettingsPanel';
import { AppearanceSettingsPanel } from './AppearanceSettingsPanel';
import { NotificationsSettingsPanel } from './NotificationsSettingsPanel';
import { CookiesSettingsPanel } from './CookiesSettingsPanel';
import { AboutSettingsPanel } from './AboutSettingsPanel';
import { FormatScopedComingSoonPanel } from './FormatScopedComingSoonPanel';
import { FileEncodingSettingsPanel } from './FileEncodingSettingsPanel';
import { FormattingSettingsPanel } from './FormattingSettingsPanel';
import styles from './SettingsModal.module.css';

const SETTINGS_PANELS: Partial<Record<string, ComponentType>> = {
  general: GeneralSettingsPanel,
  servers: ServersSettingsPanel,
  preferences: EditorPreferencesSettingsPanel,
  security: SecuritySettingsPanel,
  appearance: AppearanceSettingsPanel,
  notifications: NotificationsSettingsPanel,
  cookies: CookiesSettingsPanel,
  about: AboutSettingsPanel,
  colorScheme: () => (
    <FormatScopedComingSoonPanel
      title="Color Scheme"
      description="Choose the editor color scheme used for the REST Projection YAML and JSON views."
    />
  ),
  colorStyle: () => (
    <FormatScopedComingSoonPanel
      title="Color Style"
      description="Fine-tune which token types (keys, strings, numbers, literals) get their own color."
    />
  ),
  fileEncoding: FileEncodingSettingsPanel,
  formatting: FormattingSettingsPanel,
};

/** A category row plus the parent it belongs to (undefined for top-level rows) — used for search + lookup. */
interface FlatRow {
  category: SettingsCategory;
  parent: SettingsCategory | undefined;
}

function matches(category: SettingsCategory, q: string): boolean {
  return category.label.toLowerCase().includes(q) || category.keywords.includes(q);
}

function findActive(categories: SettingsCategory[], key: string): FlatRow | undefined {
  for (const category of categories) {
    if (category.key === key) return { category, parent: undefined };
    for (const child of category.children ?? []) {
      if (child.key === key) return { category: child, parent: category };
    }
  }
  return undefined;
}

export function SettingsModal() {
  const closeSettings = useAppStore((s) => s.closeSettings);
  const [search, setSearch] = useState('');
  const [activeKey, setActiveKey] = useState(SETTINGS_CATEGORIES[0].key);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const q = search.trim().toLowerCase();

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Build the visible tree: a top-level category is kept if it or any child matches the search;
  // once a query is active, only matching children show (all of them show when there's no query).
  const visible = SETTINGS_CATEGORIES.map((cat) => {
    const selfMatches = !q || matches(cat, q);
    const children = (cat.children ?? []).filter((child) => !q || selfMatches || matches(child, q));
    return { cat, children, show: selfMatches || children.length > 0 };
  }).filter((row) => row.show);

  const activeRow = findActive(SETTINGS_CATEGORIES, activeKey) ?? { category: SETTINGS_CATEGORIES[0], parent: undefined };
  const active = activeRow.category;

  const selectCategory = (category: SettingsCategory, hasChildren: boolean) => {
    setActiveKey(category.key);
    if (hasChildren) toggleExpanded(category.key);
  };

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
              {visible.map(({ cat, children }) => {
                const Icon = cat.icon;
                const hasChildren = cat.children != null && cat.children.length > 0;
                const expanded = hasChildren && (expandedKeys.has(cat.key) || (q !== '' && children.length > 0));
                return (
                  <div key={cat.key}>
                    <button
                      type="button"
                      className={styles.navRow}
                      data-active={cat.key === active.key}
                      onClick={() => selectCategory(cat, hasChildren)}
                    >
                      {hasChildren && (
                        <span className={styles.navRowCaret}>
                          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </span>
                      )}
                      <span className={styles.navRowIcon}>
                        <Icon size={15} />
                      </span>
                      {cat.label}
                    </button>
                    {hasChildren && expanded && (
                      <div className={styles.navChildren}>
                        {children.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <button
                              key={child.key}
                              type="button"
                              className={styles.navChildRow}
                              data-active={child.key === active.key}
                              onClick={() => selectCategory(child, false)}
                            >
                              <span className={styles.navRowIcon}>
                                <ChildIcon size={14} />
                              </span>
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {visible.length === 0 && <div className={styles.navEmpty}>No settings match &quot;{search}&quot;.</div>}
            </div>
          </div>

          {/* right pane */}
          <div className={styles.pane}>
            <div className={styles.paneHeader}>
              <span className={styles.paneTitleIcon}>
                <active.icon size={16} />
              </span>
              <div className={styles.paneTitle}>{active.label}</div>
              <button type="button" className={styles.closeBtn} title="Close" onClick={closeSettings}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.paneBody}>
              {(() => {
                const Panel = SETTINGS_PANELS[active.key];
                if (Panel) return <Panel />;
                return (
                  <div className={styles.comingSoonWrap}>
                    <div className={styles.comingSoon}>
                      <div className={styles.comingSoonTitle}>Coming Soon</div>
                      <div className={styles.comingSoonHint}>{active.label} settings aren&apos;t built yet.</div>
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
