import { useEffect } from 'react';
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
import { FieldActionSlot } from '../../lib/plugins/FieldActionSlot';
import { ParamFieldRow } from './ParamFieldRow';
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
  const setResponseCodeWithHeaderPolicy = useSpecStore((s) => s.setResponseCodeWithHeaderPolicy);
  const applyResponseHeaderPolicy = useSpecStore((s) => s.applyResponseHeaderPolicy);
  const removeResponse = useSpecStore((s) => s.removeResponse);
  const addResponseHeader = useSpecStore((s) => s.addResponseHeader);
  const setResponseHeader = useSpecStore((s) => s.setResponseHeader);
  const removeResponseHeader = useSpecStore((s) => s.removeResponseHeader);
  const expandedParamKey = useSpecStore((s) => s.expandedParamKey);
  const toggleParamExpanded = useSpecStore((s) => s.toggleParamExpanded);
  const toggleResponseContentType = useSpecStore((s) => s.toggleResponseContentType);
  const responseActiveClass = useSpecStore((s) => s.responseActiveClass);
  const setResponseActiveClass = useSpecStore((s) => s.setResponseActiveClass);

  useEffect(() => {
    endpoint.responses.forEach((response) => {
      const statusCode = Number(response.code);
      if (
        Number.isInteger(statusCode) &&
        statusCode >= 100 &&
        statusCode <= 599 &&
        response.headerPolicyStatusCode !== statusCode &&
        !response.headerPolicyError
      ) {
        void applyResponseHeaderPolicy(endpoint.id, response.id, statusCode);
      }
    });
  }, [applyResponseHeaderPolicy, endpoint.id, endpoint.responses]);

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
            const codesUsedByOtherResponses = new Set(
              endpoint.responses
                .filter((response) => response.id !== r.id)
                .map((response) => response.code),
            );
            const codeOptions = Array.from(
              new Set([
                r.code,
                ...CODES_BY_CLASS[activeClass].filter(
                  (code) => !codesUsedByOtherResponses.has(code),
                ),
              ]),
            ).sort((left, right) => Number(left) - Number(right));
            const bodyForbidden = r.code === '204';
            const schemaValue = r.schema ? `${r.schemaIsArray ? 'array' : 'schema'}:${r.schema}` : '';
            const availableContentTypes = CONTENT_TYPE_OPTIONS.filter((ct) => !r.contentTypes.includes(ct));
            const presentHeaderNames = new Set(r.headers.map((header) => header.name.trim().toLowerCase()));
            const availableHeaderPolicies = (r.headerPolicies ?? [])
              .filter((policy) => policy.policyCode !== 'forbidden')
              .filter((policy) => !presentHeaderNames.has(policy.headerName.trim().toLowerCase()))
              .sort((a, b) => a.displayOrder - b.displayOrder);

            return (
              <div key={r.id} className={styles.responseCard}>
                <div className={styles.responseTopRow}>
                  <select
                    className={styles.codeSelect}
                    style={{ background: color, borderColor: color }}
                    value={r.code}
                    onChange={(e) => void setResponseCodeWithHeaderPolicy(endpoint.id, r.id, e.target.value)}
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
                  <FieldActionSlot
                    slot="responseDescription"
                    value={r.description}
                    onChange={(v) => setResponse(endpoint.id, r.id, { description: v })}
                    hints={{ method: endpoint.method, path: endpoint.path, statusCode: r.code }}
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
                    <select
                      className={styles.ctAddSelect}
                      value=""
                      title="Add a response header allowed by the selected HTTP status"
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === '__custom__') addResponseHeader(endpoint.id, r.id);
                        else if (value) addResponseHeader(endpoint.id, r.id, value);
                      }}
                    >
                      <option value="">+ Add header</option>
                      {availableHeaderPolicies.map((policy) => (
                        <option key={policy.headerCode} value={policy.headerName}>
                          {policy.displayName} ({policy.policyCode})
                        </option>
                      ))}
                      <option value="__custom__">Custom header</option>
                    </select>
                  </div>
                  <div className={styles.rowsList}>
                    {r.headerPolicyError && (
                      <div className={styles.bodyNone}>Header policy could not be loaded: {r.headerPolicyError}</div>
                    )}
                    {r.headers.map((h) => (
                      <ParamFieldRow
                        key={h.id}
                        name={h.name}
                        nameDisabled={h.mandated}
                        onNameChange={(v) => setResponseHeader(endpoint.id, r.id, h.id, { name: v })}
                        namePlaceholder="Header-Name"
                        required={h.required}
                        requiredDisabled={h.mandated}
                        requiredTitle={h.mandated ? h.policyRationale ?? 'Required by the HTTP status policy' : undefined}
                        onToggleRequired={() =>
                          setResponseHeader(endpoint.id, r.id, h.id, { required: !h.required })
                        }
                        nullable={h.nullable}
                        onToggleNullable={() =>
                          setResponseHeader(endpoint.id, r.id, h.id, { nullable: !h.nullable })
                        }
                        example={h.example}
                        onExampleChange={(v) => setResponseHeader(endpoint.id, r.id, h.id, { example: v })}
                        expanded={expandedParamKey === h.id}
                        onToggleExpand={() => toggleParamExpanded(h.id)}
                        removeDisabled={h.mandated}
                        removeTitle={
                          h.mandated ? h.policyRationale ?? 'Required by the HTTP status policy' : 'Remove header'
                        }
                        onRemove={() => removeResponseHeader(endpoint.id, r.id, h.id)}
                      />
                    ))}
                    {r.headers.length === 0 && !r.headerPolicyError && (
                      <div className={styles.bodyNone}>No required or default-enabled headers for this status.</div>
                    )}
                  </div>
                </div>

                {/* Response body */}
                <div className={`${styles.box} ${styles.responseSubBox}`}>
                  <div className={styles.boxHeader}>
                    <span className={styles.boxTitle}>Response body</span>
                  </div>
                  {bodyForbidden ? (
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
