import { useRef } from 'react';
import { FileJson2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import { usePanelResize } from '../../lib/usePanelResize';
import type { OutlineNode } from '../../lib/restProjectionOutline';
import { RestProjectionOutlineRow } from './RestProjectionOutlineRow';
import styles from './RestProjectionOutlinePanel.module.css';

interface RestProjectionOutlinePanelProps {
  outline: OutlineNode[];
  onSelect: (line: number) => void;
}

/** Left subpanel for the REST Projection tab — a collapsible/resizable document outline (General, Tags, Paths, Operation ID, Servers, Components, Security) that jumps the Monaco editor to a section on click. */
export function RestProjectionOutlinePanel({ outline, onSelect }: RestProjectionOutlinePanelProps) {
  const width = useSpecStore((s) => s.restProjectionOutlinePanelWidth);
  const collapsed = useSpecStore((s) => s.restProjectionOutlinePanelCollapsed);
  const resizing = useSpecStore((s) => s.resizingRestProjectionOutlinePanel);
  const setWidth = useSpecStore((s) => s.setRestProjectionOutlinePanelWidth);
  const toggleCollapsed = useSpecStore((s) => s.toggleRestProjectionOutlinePanelCollapsed);
  const setResizing = useSpecStore((s) => s.setResizingRestProjectionOutlinePanel);

  const panelRef = useRef<HTMLDivElement>(null);

  usePanelResize(panelRef, resizing, setWidth, setResizing);

  return (
    <>
      <div
        ref={panelRef}
        className={styles.panel}
        data-resizing={resizing}
        style={{ width: collapsed ? 0 : width }}
      >
        <div className={styles.panelInner} style={{ width }}>
          <div className={styles.header}>
            <span className={styles.headerIcon}>
              <FileJson2 size={16} />
            </span>
            <span className={styles.headerTitle}>OpenAPI</span>
          </div>

          <div className={styles.tree}>
            {outline.map((node) => (
              <RestProjectionOutlineRow key={node.key} node={node} depth={0} onSelect={onSelect} />
            ))}
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

      <button
        type="button"
        className={styles.toggleBtn}
        data-resizing={resizing}
        style={{ left: collapsed ? 11 : width }}
        title={collapsed ? 'Expand document outline' : 'Collapse document outline'}
        onClick={toggleCollapsed}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </>
  );
}
