import { ChevronDown, ChevronRight } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import type { EndpointsPanelGroup } from '../../lib/endpointsPanelGroups';
import { EndpointRow } from './EndpointRow';
import styles from './EndpointsPanel.module.css';

interface EndpointGroupSectionProps {
  group: EndpointsPanelGroup;
  selectedPath: string | undefined;
}

export function EndpointGroupSection({ group, selectedPath }: EndpointGroupSectionProps) {
  const expandedTags = useSpecStore((s) => s.expandedTags);
  const toggleTagExpanded = useSpecStore((s) => s.toggleTagExpanded);
  const dragOverTagKey = useSpecStore((s) => s.dragOverTagKey);
  const setDragOverTag = useSpecStore((s) => s.setDragOverTag);
  const dropMethodOnTag = useSpecStore((s) => s.dropMethodOnTag);
  const draggingMethodId = useSpecStore((s) => s.draggingMethodId);

  const expanded = expandedTags[group.key] !== false;
  const isDragOver = dragOverTagKey === group.key;
  const isDefault = group.key === '__default__';

  return (
    <div
      className={styles.group}
      data-drag-over={isDragOver}
      onDragOver={(e) => {
        if (!draggingMethodId || isDefault) return;
        e.preventDefault();
        setDragOverTag(group.key);
      }}
      onDragLeave={() => {
        if (isDragOver) setDragOverTag(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (!isDefault) dropMethodOnTag(group.key);
      }}
    >
      <button type="button" className={styles.groupHeader} onClick={() => toggleTagExpanded(group.key)}>
        <span className={styles.groupCaret}>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        <span className={styles.groupLabel}>{group.label}</span>
        <span className={styles.groupSpacer} />
        <span className={styles.groupCount}>{group.count}</span>
      </button>

      {expanded && (
        <div className={styles.rows}>
          {group.rows.map((row) => (
            <EndpointRow key={row.id} row={row} selected={selectedPath === row.path} />
          ))}
        </div>
      )}
    </div>
  );
}
