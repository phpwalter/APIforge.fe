import type { ComponentType } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Tag,
  Route,
  Contact,
  Server,
  Component as ComponentsIcon,
  Waypoints,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import { isOutlineGroupDefaultExpanded, type OutlineNode } from '../../lib/restProjectionOutline';
import styles from './RestProjectionOutlinePanel.module.css';

const NODE_ICON: Partial<Record<string, ComponentType<{ size?: number | string }>>> = {
  general: FileText,
  tags: Tag,
  paths: Route,
  operationId: Contact,
  servers: Server,
  components: ComponentsIcon,
  security: KeyRound,
  schemas: Waypoints,
  securitySchemes: ShieldCheck,
};

interface RestProjectionOutlineRowProps {
  node: OutlineNode;
  depth: number;
  onSelect: (line: number) => void;
}

/** One row of the REST Projection document outline — a toggleable group header if the node has children, otherwise a leaf that jumps the editor to its line. Recurses for Components > Schemas/Security Schemes' own nested entries. */
export function RestProjectionOutlineRow({ node, depth, onSelect }: RestProjectionOutlineRowProps) {
  const expandedMap = useSpecStore((s) => s.restProjectionOutlineExpanded);
  const toggleExpanded = useSpecStore((s) => s.toggleRestProjectionOutlineExpanded);

  const Icon = NODE_ICON[node.key];
  const indent = 10 + depth * 16;

  if (node.children) {
    const isEmpty = node.children.length === 0;
    const expanded = !isEmpty && (expandedMap[node.key] ?? isOutlineGroupDefaultExpanded(node.key));
    return (
      <div>
        <button
          type="button"
          className={styles.row}
          data-depth={depth}
          disabled={isEmpty}
          style={{ paddingLeft: indent }}
          onClick={() => toggleExpanded(node.key)}
        >
          <span className={styles.caret}>
            {!isEmpty && (expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
          </span>
          {Icon && (
            <span className={styles.rowIcon}>
              <Icon size={14} />
            </span>
          )}
          <span className={styles.rowLabel}>{node.label}</span>
        </button>
        {expanded && (
          <div>
            {node.children.map((child) => (
              <RestProjectionOutlineRow key={child.key} node={child} depth={depth + 1} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={styles.row}
      data-depth={depth}
      data-leaf="true"
      disabled={node.line == null}
      title={node.label}
      style={{ paddingLeft: indent + 19 }}
      onClick={() => node.line != null && onSelect(node.line)}
    >
      {Icon && (
        <span className={styles.rowIcon}>
          <Icon size={14} />
        </span>
      )}
      <span className={styles.rowLabel}>{node.label}</span>
    </button>
  );
}