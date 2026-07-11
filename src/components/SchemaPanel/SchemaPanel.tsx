import { useEffect, useRef } from 'react';
import { Braces, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import styles from './SchemaPanel.module.css';

export function SchemaPanel() {
  const schemas = useSpecStore((s) => s.schemas);
  const selectedId = useSpecStore((s) => s.selectedId);
  const selectBlock = useSpecStore((s) => s.selectBlock);
  const addSchema = useSpecStore((s) => s.addSchema);

  const search = useSpecStore((s) => s.schemaPanelSearch);
  const setSearch = useSpecStore((s) => s.setSchemaPanelSearch);

  const width = useSpecStore((s) => s.schemaPanelWidth);
  const collapsed = useSpecStore((s) => s.schemaPanelCollapsed);
  const resizing = useSpecStore((s) => s.resizingSchemaPanel);
  const setWidth = useSpecStore((s) => s.setSchemaPanelWidth);
  const toggleCollapsed = useSpecStore((s) => s.toggleSchemaPanelCollapsed);
  const setResizing = useSpecStore((s) => s.setResizingSchemaPanel);

  const panelRef = useRef<HTMLDivElement>(null);

  const q = search.trim().toLowerCase();
  const rows = schemas.filter((s) => !q || s.name.toLowerCase().includes(q));
  const isEmpty = rows.length === 0;

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const left = panelRef.current?.getBoundingClientRect().left ?? 0;
      setWidth(e.clientX - left);
    };
    const onUp = () => setResizing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizing, setWidth, setResizing]);

  return (
    <div
      ref={panelRef}
      className={styles.panel}
      data-resizing={resizing}
      style={{ width: collapsed ? 0 : width }}
    >
      <div className={styles.panelInner} style={{ width }}>
        <div className={styles.header}>
          <span className={styles.headerIcon}>
            <Braces size={17} />
          </span>
          <span className={styles.headerTitle}>Object Schemas</span>
          <button type="button" className={styles.newBtn} onClick={addSchema}>
            <Plus size={13} /> New
          </button>
        </div>

        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <Search size={14} />
          </span>
          <input
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schemas…"
          />
        </div>

        <div className={styles.list}>
          {rows.map((schema) => (
            <div
              key={schema.id}
              className={styles.row}
              data-selected={selectedId === schema.id}
              onClick={() => selectBlock(schema.id)}
            >
              <span className={styles.rowIcon}>
                <Braces size={15} />
              </span>
              <span className={styles.rowName}>{schema.name}</span>
              <span className={styles.rowCount}>{schema.scalar ? 1 : schema.fieldCount}</span>
            </div>
          ))}
          {isEmpty && <div className={styles.emptyState}>No schemas match your search.</div>}
        </div>
      </div>

      <div
        className={styles.resizeHandle}
        title="Drag to resize"
        onMouseDown={(e) => {
          e.preventDefault();
          setResizing(true);
        }}
      />

      <button
        type="button"
        className={styles.toggleBtn}
        data-resizing={resizing}
        style={{ left: collapsed ? 11 : width }}
        title={collapsed ? 'Expand schema list' : 'Collapse schema list'}
        onClick={toggleCollapsed}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </div>
  );
}
