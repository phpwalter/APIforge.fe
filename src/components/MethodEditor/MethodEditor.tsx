import { Sparkles, X } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import type { Endpoint } from '../../types/spec';
import { methodColor, methodIcon, isIdempotent, isUnsafe } from '../../lib/methodStyle';
import { FieldActionSlot } from '../../lib/plugins/FieldActionSlot';
import { SecurityRow } from './SecurityRow';
import { TagsRow } from './TagsRow';
import { RequestPanel } from './RequestPanel';
import { ResponsePanel } from './ResponsePanel';
import styles from './MethodEditor.module.css';

interface MethodEditorProps {
  endpoint: Endpoint;
}

export function MethodEditor({ endpoint }: MethodEditorProps) {
  const setSummary = useSpecStore((s) => s.setSummary);
  const setOperationId = useSpecStore((s) => s.setOperationId);
  const generateOperationId = useSpecStore((s) => s.generateOperationId);
  const deleteMethod = useSpecStore((s) => s.deleteMethod);

  const Icon = methodIcon(endpoint.method);
  const idempotent = isIdempotent(endpoint.method);
  const unsafe = isUnsafe(endpoint.method);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.methodBadge} style={{ background: methodColor(endpoint.method) }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <Icon size={13} />
            {endpoint.method}
          </span>
        </span>
        <div className={styles.characteristics}>
          <span className={styles.characteristic} style={{ color: idempotent ? '#3b9c6e' : '#c75c5c' }}>
            • {idempotent ? 'IDEMPOTENT' : 'NON-IDEMPOTENT'}
          </span>
          <span className={styles.characteristic} style={{ color: unsafe ? '#c75c5c' : '#3b9c6e' }}>
            • {unsafe ? 'UNSAFE' : 'SAFE'}
          </span>
        </div>
        <span className={styles.spacer} />
        <button
          type="button"
          className={styles.deleteBtn}
          title="Delete this method"
          onClick={() => deleteMethod(endpoint.id)}
        >
          <X size={14} />
        </button>
      </div>

      <div className={styles.summaryRow}>
        <input
          className={styles.summaryInput}
          value={endpoint.summary}
          placeholder="Summary — what this operation does"
          onChange={(e) => setSummary(endpoint.id, e.target.value)}
        />
        <FieldActionSlot
          slot="operationSummary"
          value={endpoint.summary}
          onChange={(v) => setSummary(endpoint.id, v)}
          hints={{ method: endpoint.method, path: endpoint.path }}
        />
        <input
          className={styles.opIdInput}
          value={endpoint.operationId}
          placeholder="operationId"
          title="Unique operation identifier used by codegen & docs"
          onChange={(e) => setOperationId(endpoint.id, e.target.value)}
        />
        <button
          type="button"
          className={styles.genBtn}
          title="Generate operationId from method + path"
          onClick={() => generateOperationId(endpoint.id)}
        >
          <Sparkles size={13} />
        </button>
      </div>

      <SecurityRow endpoint={endpoint} />
      <TagsRow endpoint={endpoint} />

      <div className={styles.body}>
        <RequestPanel endpoint={endpoint} />
        <ResponsePanel endpoint={endpoint} />
      </div>
    </div>
  );
}
