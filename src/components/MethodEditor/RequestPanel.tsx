import { ArrowBigRight, Plus } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import type { Endpoint, ParamLocation } from '../../types/spec';
import { methodAllowsBody } from '../../lib/methodStyle';
import { FieldActionSlot } from '../../lib/plugins/FieldActionSlot';
import { ParamFieldRow } from './ParamFieldRow';
import styles from './MethodEditor.module.css';

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
  const expandedParamKey = useSpecStore((s) => s.expandedParamKey);
  const toggleParamExpanded = useSpecStore((s) => s.toggleParamExpanded);

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
                <ParamFieldRow
                  key={p.id}
                  name={p.name}
                  onNameChange={(v) => setParam(endpoint.id, p.id, { name: v })}
                  namePlaceholder="name"
                  location={p.in}
                  onLocationChange={(v: ParamLocation) => setParam(endpoint.id, p.id, { in: v })}
                  required={p.required}
                  onToggleRequired={() => setParam(endpoint.id, p.id, { required: !p.required })}
                  nullable={p.nullable}
                  onToggleNullable={() => setParam(endpoint.id, p.id, { nullable: !p.nullable })}
                  example={p.example}
                  onExampleChange={(v) => setParam(endpoint.id, p.id, { example: v })}
                  expanded={expandedParamKey === p.id}
                  onToggleExpand={() => toggleParamExpanded(p.id)}
                  removeDisabled={p.required}
                  removeTitle={p.required ? "Required parameters can't be removed — toggle off Required first" : 'Remove parameter'}
                  onRemove={() => removeParam(endpoint.id, p.id)}
                />
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
              <ParamFieldRow
                key={h.id}
                name={h.name}
                onNameChange={(v) => setHeader(endpoint.id, h.id, { name: v })}
                namePlaceholder="Header-Name"
                nameDisabled={h.mandated}
                required={h.required}
                onToggleRequired={() => setHeader(endpoint.id, h.id, { required: !h.required })}
                requiredDisabled={h.mandated}
                requiredTitle={h.mandated ? 'Mandated by policy' : 'Toggle required'}
                nullable={h.nullable}
                onToggleNullable={() => setHeader(endpoint.id, h.id, { nullable: !h.nullable })}
                example={h.example}
                onExampleChange={(v) => setHeader(endpoint.id, h.id, { example: v })}
                expanded={expandedParamKey === h.id}
                onToggleExpand={() => toggleParamExpanded(h.id)}
                removeDisabled={h.mandated || h.required}
                removeTitle={
                  h.mandated
                    ? 'Mandated headers cannot be removed'
                    : h.required
                      ? "Required headers can't be removed — toggle off Required first"
                      : 'Remove header'
                }
                onRemove={() => removeHeader(endpoint.id, h.id)}
              />
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
                <div className={styles.bodyDescRow}>
                  <input
                    className={styles.bodyDescInput}
                    value={endpoint.requestBodyDescription}
                    placeholder="Describe the request body…"
                    onChange={(e) => setRequestBodyDescription(endpoint.id, e.target.value)}
                  />
                  <FieldActionSlot
                    slot="requestBodyDescription"
                    value={endpoint.requestBodyDescription}
                    onChange={(v) => setRequestBodyDescription(endpoint.id, v)}
                    hints={{ method: endpoint.method, path: endpoint.path }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
