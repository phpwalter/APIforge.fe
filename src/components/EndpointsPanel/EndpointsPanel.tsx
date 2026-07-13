import { useMemo, useRef } from 'react';
import { Timeline as EndpointsIcon, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import { buildEndpointsPanelGroups } from '../../lib/endpointsPanelGroups';
import { usePanelResize } from '../../lib/usePanelResize';
import { EndpointGroupSection } from './EndpointGroupSection';
import styles from './EndpointsPanel.module.css';

export function EndpointsPanel() {
  const endpoints = useSpecStore((s) => s.endpoints);
  const selectedId = useSpecStore((s) => s.selectedId);
  const addEndpoint = useSpecStore((s) => s.addEndpoint);

  const panelSearch = useSpecStore((s) => s.panelSearch);
  const setPanelSearch = useSpecStore((s) => s.setPanelSearch);
  const expandAllTags = useSpecStore((s) => s.expandAllTags);
  const collapseAllTags = useSpecStore((s) => s.collapseAllTags);

  const panelWidth = useSpecStore((s) => s.panelWidth);
  const panelCollapsed = useSpecStore((s) => s.panelCollapsed);
  const resizingPanel = useSpecStore((s) => s.resizingPanel);
  const setPanelWidth = useSpecStore((s) => s.setPanelWidth);
  const toggleePanelCollapsed = useSpecStore((s) => s.toggleePanelCollapsed);
  const setResizingPanel = useSpecStore((s) => s.setResizingPanel);

  const panelRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => buildEndpointsPanelGroups(endpoints, panelSearch), [endpoints, panelSearch]);
  const isEmpty = groups.length === 0;
  const selectedPath = endpoints.find((e) => e.id === selectedId)?.path;

  usePanelResize(panelRef, resizingPanel, setPanelWidth, setResizingPanel);

  return (
    <>
      <div
        ref={panelRef}
        className={styles.panel}
        data-resizing={resizingPanel}
        style={{ width: panelCollapsed ? 0 : panelWidth }}
      >
        <div className={styles.panelInner} style={{ width: panelWidth }}>
          <div className={styles.header}>
            <span className={styles.headerIcon}>
              <EndpointsIcon size={17} style={{ transform: 'scaleX(-1)' }} />
            </span>
            <span className={styles.headerTitle}>Endpoints</span>
            <button type="button" className={styles.newBtn} onClick={addEndpoint}>
              <Plus size={13} /> New
            </button>
          </div>

          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>
              <Search size={14} />
            </span>
            <input
              className={styles.searchInput}
              value={panelSearch}
              onChange={(e) => setPanelSearch(e.target.value)}
              placeholder="Search endpoints…"
            />
          </div>

          <div className={styles.expandRow}>
            <button
              type="button"
              className={styles.expandBtn}
              onClick={() => expandAllTags(groups.map((g) => g.key))}
            >
              Expand all
            </button>
            <span className={styles.expandDot}>·</span>
            <button
              type="button"
              className={styles.expandBtn}
              onClick={() => collapseAllTags(groups.map((g) => g.key))}
            >
              Collapse all
            </button>
          </div>

          <div className={styles.groupList}>
            {groups.map((group) => (
              <EndpointGroupSection key={group.key} group={group} selectedPath={selectedPath} />
            ))}
            {isEmpty && <div className={styles.emptyState}>No endpoints match your search.</div>}
          </div>
        </div>

        <div
          className={styles.resizeHandle}
          title="Drag to resize"
          onMouseDown={(e) => {
            e.preventDefault();
            setResizingPanel(true);
          }}
        />
      </div>

      <button
        type="button"
        className={styles.toggleBtn}
        data-resizing={resizingPanel}
        style={{ left: panelCollapsed ? 11 : panelWidth }}
        title={panelCollapsed ? 'Expand endpoint list' : 'Collapse endpoint list'}
        onClick={toggleePanelCollapsed}
      >
        {panelCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </>
  );
}
