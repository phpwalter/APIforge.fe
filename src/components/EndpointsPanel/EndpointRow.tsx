import { useSpecStore } from '../../state/useSpecStore';
import { methodColor } from '../../lib/methodStyle';
import type { EndpointsPanelRow } from '../../lib/endpointsPanelGroups';
import styles from './EndpointsPanel.module.css';

interface EndpointRowProps {
  row: EndpointsPanelRow;
  selected: boolean;
}

export function EndpointRow({ row, selected }: EndpointRowProps) {
  const selectBlock = useSpecStore((s) => s.selectBlock);
  const startDragMethod = useSpecStore((s) => s.startDragMethod);
  const endDragMethod = useSpecStore((s) => s.endDragMethod);

  return (
    <div
      className={styles.row}
      data-selected={selected}
      style={{ marginLeft: row.depth * 14 }}
      onClick={() => selectBlock(row.id)}
    >
      <div className={styles.rowPath}>{row.path}</div>
      <div className={styles.rowMethods}>
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
              selectBlock(m.id);
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
