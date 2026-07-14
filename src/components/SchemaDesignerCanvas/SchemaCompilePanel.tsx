import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Braces } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import { usePanelResize } from '../../lib/usePanelResize';
import { compileSchemaCode, type SchemaCompileFormat } from '../../lib/schemaCompile';
import type { Schema } from '../../types/spec';
import styles from './SchemaCompilePanel.module.css';

const FORMATS: SchemaCompileFormat[] = ['json', 'yaml', 'xml'];

interface Props {
  schema: Schema;
}

export function SchemaCompilePanel({ schema }: Props) {
  const format = useSpecStore((s) => s.schemaCompileFormat);
  const setFormat = useSpecStore((s) => s.setSchemaCompileFormat);
  const width = useSpecStore((s) => s.compilePanelWidth);
  const collapsed = useSpecStore((s) => s.compilePanelCollapsed);
  const resizing = useSpecStore((s) => s.resizingCompilePanel);
  const setWidth = useSpecStore((s) => s.setCompilePanelWidth);
  const toggleCollapsed = useSpecStore((s) => s.toggleCompilePanelCollapsed);
  const setResizing = useSpecStore((s) => s.setResizingCompilePanel);

  const panelRef = useRef<HTMLDivElement>(null);
  usePanelResize(panelRef, resizing, setWidth, setResizing, 'right');

  const code = compileSchemaCode(schema, format);

  return (
    <>
      <button
        type="button"
        className={styles.toggleBtn}
        data-resizing={resizing}
        style={{ right: collapsed ? 11 : width }}
        title={collapsed ? 'Expand compiled preview' : 'Collapse compiled preview'}
        onClick={toggleCollapsed}
      >
        {collapsed ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </button>
      <div
        ref={panelRef}
        className={styles.panel}
        data-resizing={resizing}
        style={{ width: collapsed ? 0 : width }}
      >
        <div className={styles.panelInner} style={{ width }}>
          <div className={styles.header}>
            <span className={styles.headerIcon}>
              <Braces size={15} />
            </span>
            <span className={styles.headerTitle}>Live Compiled {format.toUpperCase()} Schema</span>
            <div className={styles.formatTabs}>
              {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={styles.formatBtn}
                  data-active={format === f}
                  onClick={() => setFormat(f)}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.body}>
            <pre className={styles.code}>{code}</pre>
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
      </div>
    </>
  );
}
