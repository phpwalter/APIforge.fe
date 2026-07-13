import { ArrowBigRight, Plus, X } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import type { Endpoint, ParamLocation } from '../../types/spec';
import { methodAllowsBody } from '../../lib/methodStyle';
import styles from './MethodEditor.module.css';

const LOCATIONS: ParamLocation[] = ['query', 'path', 'header', 'cookie'];

interface RequestPanelProps {
  endpoint: Endpoint;
}

export function RequestPanel({ endpoint }: RequestPanelProps) {
  const addParam = useSpecStore((s) => s.addParam);
  const setParam = useSpecStore((s) => s.setParam);
  const removeParam = useSpecStore((s) => s.removeParam);
  const addHeader = useSpecStore((s) => s.addHeader);
  const setHeader = useSpecStore((s) => s.setHeader);
  const removeHeader = useSpecStore((s) => s.removeHeader);
  const toggleRequestBody = useSpecStore((s) => s.toggleRequestBody);
  const setRequestBodyDescription = useSpecStore((s) => s.setRequestBodyDescription);

  const allowsBody = methodAllowsBody(endpoint.method);

  return (
    <div className={styles.col}>
      <div className={styles.colHeading}>
        <span className={styles.colHeadingIcon}>
          <ArrowBigRight size={16} />
        </span>
        Request
      </div>
      <div className={styles.colBody}>
        {/* Parameters — GET only, per the demo UI */}
        {endpoint.method === 'GET' && (
          <div className={styles.box}>
            <div className={styles.boxHeader}>
              <span className={styles.boxTitle}>Parameters</span>
              <button type="button" className={styles.addBtn} title="Add" onClick={() => addParam(endpoint.id)}>
                <Plus size={12} />
              </button>
            </div>
            <div className={styles.rowsList}>
              {endpoint.params.map((p) => (
                <div key={p.id} className={styles.fieldRow}>
                  <button
                    type="button"
                    className={styles.reqToggle}
                    data-required={p.required}
                    title="Toggle required"
                    onClick={() => setParam(endpoint.id, p.id, { required: !p.required })}
                  >
                    {p.required ? '*' : '?'}
                  </button>
                  <input
                    className={styles.nameInput}
                    value={p.name}
                    placeholder="name"
                    onChange={(e) => setParam(endpoint.id, p.id, { name: e.target.value })}
                  />
                  <select
                    className={styles.locSelect}
                    value={p.in}
                    onChange={(e) => setParam(endpoint.id, p.id, { in: e.target.value as ParamLocation })}
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    title="Remove parameter"
                    onClick={() => removeParam(endpoint.id, p.id)}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              {endpoint.params.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-faint)', fontStyle: 'italic' }}>No parameters</div>
              )}
            </div>
          </div>
        )}

        {/* Headers */}
        <div className={styles.box}>
          <div className={styles.boxHeader}>
            <span className={styles.boxTitle}>Headers</span>
            <button type="button" className={styles.addBtn} title="Add" onClick={() => addHeader(endpoint.id)}>
              <Plus size={12} />
            </button>
          </div>
          <div className={styles.rowsList}>
            {endpoint.headers.map((h) => (
              <div key={h.id} className={styles.fieldRow}>
                <button
                  type="button"
                  className={styles.reqToggle}
                  data-required={h.required}
                  disabled={h.mandated}
                  title={h.mandated ? 'Mandated by policy' : 'Toggle required'}
                  onClick={() => setHeader(endpoint.id, h.id, { required: !h.required })}
                >
                  {h.required ? '*' : '?'}
                </button>
                <input
                  className={styles.nameInput}
                  value={h.name}
                  placeholder="Header-Name"
                  disabled={h.mandated}
                  onChange={(e) => setHeader(endpoint.id, h.id, { name: e.target.value })}
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  disabled={h.mandated}
                  title={h.mandated ? 'Mandated headers cannot be removed' : 'Remove header'}
                  onClick={() => removeHeader(endpoint.id, h.id)}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            {endpoint.headers.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-faint)', fontStyle: 'italic' }}>No headers</div>
            )}
          </div>
        </div>

        {/* Request body */}
        <div className={styles.bodyBox}>
          <div className={styles.boxTitle} style={{ marginBottom: 8 }}>
            Request body
          </div>
          {!allowsBody && (
            <div className={styles.bodyNone}>
              None required — {endpoint.method} does not carry a request body
            </div>
          )}
          {allowsBody && (
            <>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-dim)' }}>
                <input
                  type="checkbox"
                  checked={endpoint.requestBodyEnabled}
                  onChange={() => toggleRequestBody(endpoint.id)}
                />
                This operation has a request body
              </label>
              {endpoint.requestBodyEnabled && (
                <input
                  className={styles.bodyDescInput}
                  value={endpoint.requestBodyDescription}
                  placeholder="Describe the request body…"
                  onChange={(e) => setRequestBodyDescription(endpoint.id, e.target.value)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
