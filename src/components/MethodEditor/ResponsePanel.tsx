import { ArrowBigLeft, Plus, X } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import type { Endpoint } from '../../types/spec';
import {
  CLASS_COLOR,
  CLASS_ORDER,
  CODES_BY_CLASS,
  CONTENT_TYPE_OPTIONS,
  classOf,
  colorForCode,
  defaultActiveClass,
  reasonForCode,
} from '../../lib/responseClass';
import styles from './MethodEditor.module.css';

const NEW_SCHEMA_VALUE = '__new__';

interface ResponsePanelProps {
  endpoint: Endpoint;
}

export function ResponsePanel({ endpoint }: ResponsePanelProps) {
  const schemas = useSpecStore((s) => s.schemas);
  const addSchemaReturningName = useSpecStore((s) => s.addSchemaReturningName);
  const addResponseForClass = useSpecStore((s) => s.addResponseForClass);
  const setResponse = useSpecStore((s) => s.setResponse);
  const removeResponse = useSpecStore((s) => s.removeResponse);
  const addResponseHeader = useSpecStore((s) => s.addResponseHeader);
  const setResponseHeader = useSpecStore((s) => s.setResponseHeader);
  const removeResponseHeader = useSpecStore((s) => s.removeResponseHeader);
  const toggleResponseContentType = useSpecStore((s) => s.toggleResponseContentType);
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
          {visible.length === 0 && (
            <div className={styles.emptyResponses}>
              <div className={styles.emptyResponsesTitle}>
                No <span className={styles.emptyResponsesClass}>{activeClass}</span> responses defined
              </div>
              <div className={styles.emptyResponsesHint}>
                Add one with + Response, or pick another status class above.
              </div>
            </div>
          )}
          {visible.map((r) => {
            const color = colorForCode(r.code);
            const codeOptions = Array.from(new Set([r.code, ...CODES_BY_CLASS[activeClass]])).sort();
            const noBody = r.code === '204';
            const schemaValue = r.schema ? `${r.schemaIsArray ? 'array' : 'schema'}:${r.schema}` : '';
            const availableContentTypes = CONTENT_TYPE_OPTIONS.filter((ct) => !r.contentTypes.includes(ct));

            return (
              <div key={r.id} className={styles.responseCard}>
                <div className={styles.responseTopRow}>
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
                    placeholder={reasonForCode(r.code) ?? 'Description'}
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

                {/* Headers */}
                <div className={`${styles.box} ${styles.responseSubBox}`}>
                  <div className={styles.boxHeader}>
                    <span className={styles.boxTitle}>Headers</span>
                    <button
                      type="button"
                      className={styles.addBtn}
                      title="Add"
                      disabled={noBody}
                      onClick={() => addResponseHeader(endpoint.id, r.id)}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  {noBody ? (
                    <div className={styles.bodyNone}>
                      None required — 204 responses carry no message body or content headers
                    </div>
                  ) : (
                    <div className={styles.rowsList}>
                      {r.headers.map((h) => (
                        <div key={h.id} className={styles.fieldRow}>
                          <button
                            type="button"
                            className={styles.reqToggle}
                            data-required={h.required}
                            title="Toggle required"
                            onClick={() => setResponseHeader(endpoint.id, r.id, h.id, { required: !h.required })}
                          >
                            {h.required ? '*' : '?'}
                          </button>
                          <input
                            className={styles.nameInput}
                            value={h.name}
                            placeholder="Header-Name"
                            onChange={(e) => setResponseHeader(endpoint.id, r.id, h.id, { name: e.target.value })}
                          />
                          <button
                            type="button"
                            className={styles.removeBtn}
                            title="Remove header"
                            onClick={() => removeResponseHeader(endpoint.id, r.id, h.id)}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                      {r.headers.length === 0 && <div className={styles.bodyNone}>No headers</div>}
                    </div>
                  )}
                </div>

                {/* Response body */}
                <div className={`${styles.box} ${styles.responseSubBox}`}>
                  <div className={styles.boxHeader}>
                    <span className={styles.boxTitle}>Response body</span>
                  </div>
                  {noBody ? (
                    <div className={styles.bodyNone}>None required — 204 responses carry no message body</div>
                  ) : (
                    <div className={styles.bodyFieldsCol}>
                      <div className={styles.bodyFieldRow}>
                        <span className={styles.bodyFieldLabel}>schema</span>
                        <select
                          className={styles.schemaSelect}
                          value={schemaValue}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === NEW_SCHEMA_VALUE) {
                              const name = addSchemaReturningName();
                              setResponse(endpoint.id, r.id, { schema: name, schemaIsArray: false });
                              return;
                            }
                            const schemaIsArray = v.startsWith('array:');
                            const schema = v ? v.slice(v.indexOf(':') + 1) : '';
                            setResponse(endpoint.id, r.id, { schema, schemaIsArray });
                          }}
                        >
                          <option value="">— none —</option>
                          <option value={NEW_SCHEMA_VALUE}>— New Schema —</option>
                          {schemas.map((s) => (
                            <option key={`schema:${s.name}`} value={`schema:${s.name}`}>
                              {s.name}
                            </option>
                          ))}
                          {schemas.map((s) => (
                            <option key={`array:${s.name}`} value={`array:${s.name}`}>
                              {`array of ${s.name}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      {r.schema && (
                        <div className={styles.bodyFieldRowTop}>
                          <span className={styles.bodyFieldLabelTop}>type</span>
                          <div className={styles.ctChipsWrap}>
                            {r.contentTypes.map((ct) => (
                              <span key={ct} className={styles.ctChip}>
                                {ct}
                                <button
                                  type="button"
                                  className={styles.ctChipRemove}
                                  title="Remove content-type"
                                  onClick={() => toggleResponseContentType(endpoint.id, r.id, ct)}
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            ))}
                            {availableContentTypes.length > 0 && (
                              <select
                                className={styles.ctAddSelect}
                                value=""
                                title="Add a response content-type"
                                onChange={(e) => {
                                  if (e.target.value) toggleResponseContentType(endpoint.id, r.id, e.target.value);
                                }}
                              >
                                <option value="">+ Add type</option>
                                {availableContentTypes.map((ct) => (
                                  <option key={ct} value={ct}>
                                    {ct}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
