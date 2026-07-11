import { useState } from 'react';
import { ArrowBigLeft, Plus, X } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import type { Endpoint } from '../../types/spec';
import styles from './MethodEditor.module.css';

const CLASS_COLOR: Record<string, string> = {
  '1xx': '#7c7c8a',
  '2xx': '#3b9c6e',
  '3xx': '#4a82d8',
  '4xx': '#c79a3a',
  '5xx': '#c75c5c',
};
const CLASS_ORDER = ['1xx', '2xx', '3xx', '4xx', '5xx'];

function classOf(code: string): string {
  const n = parseInt(code, 10);
  return `${isNaN(n) ? 1 : Math.floor(n / 100)}xx`;
}

interface ResponsePanelProps {
  endpoint: Endpoint;
}

export function ResponsePanel({ endpoint }: ResponsePanelProps) {
  const addResponse = useSpecStore((s) => s.addResponse);
  const setResponse = useSpecStore((s) => s.setResponse);
  const removeResponse = useSpecStore((s) => s.removeResponse);
  const [activeClass, setActiveClass] = useState<string | null>(null);

  const presentClasses = new Set(endpoint.responses.map((r) => classOf(r.code)));
  const visible = activeClass ? endpoint.responses.filter((r) => classOf(r.code) === activeClass) : endpoint.responses;

  return (
    <div className={styles.col}>
      <div className={styles.colHeading}>
        <span className={styles.colHeadingIcon}>
          <ArrowBigLeft size={16} />
        </span>
        Response
      </div>
      <div className={styles.colBody}>
        <div className={styles.box}>
          <div className={styles.classPills}>
            {CLASS_ORDER.map((cls) => {
              const has = presentClasses.has(cls);
              const active = activeClass === cls;
              const color = CLASS_COLOR[cls];
              return (
                <button
                  key={cls}
                  type="button"
                  className={styles.classPill}
                  style={{
                    color: has ? '#fff' : color,
                    background: has ? color : 'transparent',
                    borderColor: color,
                    borderStyle: has ? 'solid' : 'dashed',
                    opacity: has ? (active || !activeClass ? 1 : 0.45) : 0.55,
                    boxShadow: active ? `0 0 0 3px ${color}55` : 'none',
                  }}
                  onClick={() => setActiveClass(active ? null : cls)}
                  title={has ? `Filter to ${cls} responses` : `No ${cls} responses yet`}
                >
                  {cls}
                </button>
              );
            })}
          </div>

          <div className={styles.boxHeader}>
            <span className={styles.boxTitle}>Responses</span>
            <button
              type="button"
              className={styles.addBtn}
              title="Add"
              onClick={() => addResponse(endpoint.id)}
            >
              <Plus size={12} />
            </button>
          </div>
          <div className={styles.rowsList}>
            {visible.map((r) => {
              const color = CLASS_COLOR[classOf(r.code)];
              return (
                <div key={r.id} className={styles.responseRow}>
                  <input
                    className={styles.codeInput}
                    style={{ background: color, borderColor: color }}
                    value={r.code}
                    onChange={(e) => setResponse(endpoint.id, r.id, { code: e.target.value })}
                  />
                  <input
                    className={styles.descInput}
                    value={r.description}
                    placeholder="Description"
                    onChange={(e) => setResponse(endpoint.id, r.id, { description: e.target.value })}
                  />
                  <button
                    type="button"
                    className={styles.removeBtn}
                    title="Remove response"
                    onClick={() => removeResponse(endpoint.id, r.id)}
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}
            {visible.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-faint)', fontStyle: 'italic' }}>
                No responses{activeClass ? ` in ${activeClass}` : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
