import { ArrowBigLeft, Plus, X } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import type { Endpoint } from '../../types/spec';
import {
  CLASS_COLOR,
  CLASS_ORDER,
  CODES_BY_CLASS,
  classOf,
  colorForCode,
  defaultActiveClass,
} from '../../lib/responseClass';
import styles from './MethodEditor.module.css';

interface ResponsePanelProps {
  endpoint: Endpoint;
}

export function ResponsePanel({ endpoint }: ResponsePanelProps) {
  const addResponseForClass = useSpecStore((s) => s.addResponseForClass);
  const setResponse = useSpecStore((s) => s.setResponse);
  const removeResponse = useSpecStore((s) => s.removeResponse);
  const responseActiveClass = useSpecStore((s) => s.responseActiveClass);
  const setResponseActiveClass = useSpecStore((s) => s.setResponseActiveClass);

  const presentClasses = new Set(endpoint.responses.map((r) => classOf(r.code)));
  const activeClass = responseActiveClass[endpoint.id] ?? defaultActiveClass(presentClasses);
  const visible = endpoint.responses.filter((r) => classOf(r.code) === activeClass);

  return (
    <div className={styles.col}>
      <div className={styles.responseHead}>
        <div className={styles.responseHeadLeft}>
          <span className={styles.colHeadingIcon}>
            <ArrowBigLeft size={16} />
          </span>
          <span className={styles.responseHeadTitle}>Responses</span>
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
                    opacity: has ? (active ? 1 : 0.45) : 0.55,
                    boxShadow: active ? `0 0 0 3px ${color}55` : 'none',
                  }}
                  onClick={() => setResponseActiveClass(endpoint.id, cls)}
                  title={has ? `${cls} responses` : `No ${cls} responses defined`}
                >
                  {cls}
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          className={styles.addBtn}
          title="Add"
          onClick={() => addResponseForClass(endpoint.id, activeClass)}
        >
          <Plus size={12} />
        </button>
      </div>

      <div className={styles.colBody}>
        <div className={styles.rowsList}>
          {visible.map((r) => {
            const color = colorForCode(r.code);
            const codeOptions = Array.from(new Set([r.code, ...CODES_BY_CLASS[activeClass]])).sort();
            return (
              <div key={r.id} className={styles.responseRow}>
                <select
                  className={styles.codeSelect}
                  style={{ background: color, borderColor: color }}
                  value={r.code}
                  onChange={(e) => setResponse(endpoint.id, r.id, { code: e.target.value })}
                >
                  {codeOptions.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
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
              No {activeClass} responses defined — click + to add one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
