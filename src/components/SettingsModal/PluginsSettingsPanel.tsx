import { useState } from 'react';
import { Search, Check } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { PLUGINS } from '../../lib/plugins/registry';
import type { Plugin } from '../../lib/plugins/types';
import styles from './PluginsSettingsPanel.module.css';

type Tab = 'marketplace' | 'installed';

interface DetailProps {
  plugin: Plugin;
  enabled: boolean;
  onToggle: () => void;
}

function PluginDetail({ plugin, enabled, onToggle }: DetailProps) {
  const Icon = plugin.icon;
  const PluginSettings = plugin.settingsPanel;

  return (
    <>
      <div className={styles.detailHeader}>
        <span className={styles.detailIcon}>
          <Icon size={32} />
        </span>
        <div>
          <div className={styles.detailTitle}>{plugin.label}</div>
          <div className={styles.detailMeta}>
            {plugin.author} · {plugin.version}
          </div>
        </div>
      </div>

      <button type="button" className={styles.toggleBtn} data-enabled={enabled} onClick={onToggle}>
        {enabled ? 'Disable' : 'Enable'}
      </button>

      <div className={styles.detailDescription}>{plugin.description}</div>

      {enabled && PluginSettings && (
        <div className={styles.detailSettings}>
          <PluginSettings />
        </div>
      )}
    </>
  );
}

export function PluginsSettingsPanel() {
  const enabledPluginIds = useAppStore((s) => s.enabledPluginIds);
  const togglePlugin = useAppStore((s) => s.togglePlugin);
  const [tab, setTab] = useState<Tab>('installed');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | undefined>(PLUGINS[0]?.id);

  const q = query.trim().toLowerCase();
  const filtered = PLUGINS.filter((p) => !q || p.label.toLowerCase().includes(q));
  const selected = filtered.find((p) => p.id === selectedId) ?? filtered[0];

  return (
    <>
      <div>
        <div className={styles.title}>Plugins</div>
        <div className={styles.description}>
          Optional modules that add inline actions and their own settings — enable or disable each independently.
        </div>
      </div>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'marketplace'}
          className={styles.tab}
          data-active={tab === 'marketplace'}
          onClick={() => setTab('marketplace')}
        >
          Marketplace
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'installed'}
          className={styles.tab}
          data-active={tab === 'installed'}
          onClick={() => setTab('installed')}
        >
          Installed
        </button>
      </div>

      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>
          <Search size={13} />
        </span>
        <input
          className={styles.searchInput}
          placeholder="Type to see options"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {tab === 'marketplace' ? (
        <div className={styles.emptyState}>
          No marketplace listings yet — plugins currently ship built-in with APIforge.
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.listPane}>
            {filtered.map((plugin) => {
              const Icon = plugin.icon;
              const enabled = enabledPluginIds.has(plugin.id);
              const active = plugin.id === selected?.id;
              return (
                <div key={plugin.id} className={styles.listRow} data-active={active}>
                  <button type="button" className={styles.listRowMain} onClick={() => setSelectedId(plugin.id)}>
                    <span className={styles.listRowIcon}>
                      <Icon size={18} />
                    </span>
                    <span className={styles.listRowBody}>
                      <div className={styles.listRowLabel}>{plugin.label}</div>
                      <div className={styles.listRowMeta}>{plugin.version}</div>
                    </span>
                  </button>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={enabled}
                    aria-label={`Enable ${plugin.label}`}
                    className={styles.checkbox}
                    data-checked={enabled}
                    onClick={() => togglePlugin(plugin.id)}
                  >
                    {enabled && <Check size={12} />}
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && <div className={styles.listEmpty}>No plugins match &quot;{query}&quot;.</div>}
          </div>

          <div className={styles.detailPane}>
            {selected ? (
              <PluginDetail
                plugin={selected}
                enabled={enabledPluginIds.has(selected.id)}
                onToggle={() => togglePlugin(selected.id)}
              />
            ) : (
              <div className={styles.emptyState}>Select a plugin to see details.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
