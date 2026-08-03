import { useSpecStore } from '../../state/useSpecStore';
import { methodColor } from '../../lib/methodStyle';
import type { EndpointsPanelRow } from '../../lib/endpointsPanelGroups';
import styles from './EndpointsPanel.module.css';

interface EndpointRowProps {
  row: EndpointsPanelRow;
  selected: boolean;
}

export function EndpointRow({ row, selected }: EndpointRowProps) {
  const selectEndpoint = useSpecStore((s) => s.selectEndpoint);
  const selectEndpointDraft = useSpecStore((s) => s.selectEndpointDraft);
  const startDragMethod = useSpecStore((s) => s.startDragMethod);
  const endDragMethod = useSpecStore((s) => s.endDragMethod);

  return (
    <div
      className={styles.row}
      data-selected={selected}
      style={{ marginLeft: row.depth * 14 }}
      onClick={() => row.draftId ? selectEndpointDraft(row.draftId) : selectEndpoint(row.id)}
    >
      <div className={styles.rowPath}>{row.path}</div>
      <div className={styles.rowMethods}>
        {row.methods.length === 0 && <span className={styles.methodChip} title="No methods have been added">NO METHOD</span>}
        {row.methods.map((m) => (
          <button
            key={m.id}
            type="button"
            className={styles.methodChip}
            style={{ background: methodColor(m.method) }}
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', m.id);
              startDragMethod(m.id);
            }}
            onDragEnd={endDragMethod}
            onClick={(e) => {
              e.stopPropagation();
              selectEndpoint(m.id);
            }}
            title={`Open ${m.method} ${row.path} — drag onto a tag to assign it`}
          >
            {m.method}
          </button>
        ))}
      </div>
    </div>
  );
}
