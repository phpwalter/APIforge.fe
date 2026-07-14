import { useMemo, useState } from 'react';
import { Braces, ChevronLeft, ChevronRight, Search, SquarePlus, X } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import { PRIM_CATEGORIES, findPrimitive, findPrimitiveCategory, type Primitive } from '../../lib/primitives';
import type { SchemaFieldType } from '../../types/spec';
import styles from './FieldPickerModal.module.css';

const JSON_TYPE_TINT: Record<string, string> = {
  string: '#4a82d8',
  integer: '#3b9c6e',
  number: '#3b9c6e',
  boolean: '#c79a3a',
  array: '#a86fd8',
  object: '#7c7c8a',
};

const PATTERN_SUGGESTIONS = [
  { label: 'Email', pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' },
  { label: 'UUID', pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' },
  { label: 'Slug', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
  { label: 'Date (ISO)', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
  { label: 'Alpha only', pattern: '^[A-Za-z]+$' },
];

function exampleText(value: unknown): string {
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function examplePlaceholderFor(t: SchemaFieldType): string {
  if (t === 'integer') return '42';
  if (t === 'number') return '3.14';
  if (t === 'boolean') return 'true';
  if (t === 'array') return '';
  return 'e.g. sample value';
}

function tipRowsFor(p: Primitive): { k: string; v: string }[] {
  const v = p.validation;
  const rows: { k: string; v: string }[] = [];
  if (p.format) rows.push({ k: 'Format', v: p.format });
  if (v.enum) rows.push({ k: 'Enum', v: v.enum.join(', ') });
  if (v.pattern) rows.push({ k: 'Pattern', v: v.pattern });
  if (v.min !== undefined) rows.push({ k: 'Min', v: String(v.min) });
  if (v.max !== undefined) rows.push({ k: 'Max', v: String(v.max) });
  if (v.minLength !== undefined) rows.push({ k: 'Min length', v: String(v.minLength) });
  if (v.maxLength !== undefined) rows.push({ k: 'Max length', v: String(v.maxLength) });
  return rows;
}

export function FieldPickerModal() {
  const open = useSpecStore((s) => s.fieldPickerOpen);
  const schemas = useSpecStore((s) => s.schemas);
  const mode = useSpecStore((s) => s.fieldPickerMode);
  const category = useSpecStore((s) => s.fieldPickerCategory);
  const search = useSpecStore((s) => s.fieldPickerSearch);
  const selectedKey = useSpecStore((s) => s.fieldPickerSelectedKey);
  const convertIndex = useSpecStore((s) => s.fieldPickerConvertIndex);
  const customDraft = useSpecStore((s) => s.customFieldDraft);

  const closeFieldPicker = useSpecStore((s) => s.closeFieldPicker);
  const setFieldPickerMode = useSpecStore((s) => s.setFieldPickerMode);
  const setFieldPickerCategory = useSpecStore((s) => s.setFieldPickerCategory);
  const setFieldPickerSearch = useSpecStore((s) => s.setFieldPickerSearch);
  const selectFieldPickerPrimitive = useSpecStore((s) => s.selectFieldPickerPrimitive);
  const insertPrimitiveField = useSpecStore((s) => s.insertPrimitiveField);
  const insertSchemaRefField = useSpecStore((s) => s.insertSchemaRefField);
  const addSchemaReturningName = useSpecStore((s) => s.addSchemaReturningName);
  const setCustomFieldDraft = useSpecStore((s) => s.setCustomFieldDraft);
  const addCustomField = useSpecStore((s) => s.addCustomField);

  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const formatOptions = useMemo(() => {
    const set = new Set<string>();
    PRIM_CATEGORIES.forEach((c) => c.prims.forEach((p) => p.format && set.add(p.format)));
    return [...set].sort();
  }, []);

  if (!open) return null;

  const q = search.trim().toLowerCase();
  const primMatch = (p: Primitive) =>
    !q || p.key.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.jsonType.includes(q);
  const catHasMatch = (c: (typeof PRIM_CATEGORIES)[number]) => c.label.toLowerCase().includes(q) || c.prims.some(primMatch);
  const visibleCats = q ? PRIM_CATEGORIES.filter(catHasMatch) : PRIM_CATEGORIES;

  let activeCatKey = category || PRIM_CATEGORIES[0].key;
  if (q) {
    const cur = PRIM_CATEGORIES.find((c) => c.key === activeCatKey);
    const curHasMatch = cur && cur.prims.some(primMatch);
    if (!curHasMatch) {
      const firstWith = visibleCats.find((c) => c.prims.some(primMatch));
      if (firstWith) activeCatKey = firstWith.key;
    }
  }
  const activeCat = PRIM_CATEGORIES.find((c) => c.key === activeCatKey);
  const primItems = (activeCat?.prims ?? []).filter(primMatch);

  const selectedPrim = selectedKey ? findPrimitive(selectedKey) : null;
  const selectedPrimCat = selectedKey ? findPrimitiveCategory(selectedKey) : null;

  const title = convertIndex != null ? 'Convert property' : 'Add schema property';
  const subtitle = 'Pick a reusable primitive, reference another schema, or define a custom property';

  const addSchemaRows = schemas.filter((sc) => !q || sc.name.toLowerCase().includes(q));

  const cType = customDraft.type;
  const isStringT = cType === 'string';
  const isNumT = cType === 'integer' || cType === 'number';
  const isArrT = cType === 'array';
  const customNameTrimmed = customDraft.name.trim();
  const customAddDisabled = !customNameTrimmed;
  const arraySchemaOptions = schemas.map((sc) => ({ value: `ref:${sc.name}`, label: `→ ${sc.name}` }));

  return (
    <div className={styles.scrim} onClick={closeFieldPicker}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Braces size={17} />
          </div>
          <div className={styles.headerText}>
            <div className={styles.headerTitle}>{title}</div>
            <div className={styles.headerSubtitle}>{subtitle}</div>
          </div>
          {mode !== 'custom' && (
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>
                <Search size={14} />
              </span>
              <input
                className={styles.searchInput}
                value={search}
                onChange={(e) => setFieldPickerSearch(e.target.value)}
                placeholder="Search primitives…"
              />
            </div>
          )}
          <button type="button" className={styles.closeBtn} title="Close" onClick={closeFieldPicker}>
            <X size={16} />
          </button>
        </div>

        <div className={styles.tabStrip}>
          <button
            type="button"
            className={styles.tabBtn}
            data-active={mode !== 'schema'}
            onClick={() => setFieldPickerMode('primitive')}
          >
            Primitives
          </button>
          <button
            type="button"
            className={styles.tabBtn}
            data-active={mode === 'schema'}
            onClick={() => setFieldPickerMode('schema')}
          >
            Schemas
          </button>
          <span className={styles.tabSpacer} />
          {mode !== 'custom' && (
            <button type="button" className={styles.customTabBtn} onClick={() => setFieldPickerMode('custom')}>
              <SquarePlus size={13} /> Define custom property
            </button>
          )}
        </div>

        <div className={styles.body}>
          {mode !== 'schema' && mode !== 'custom' && (
            <div className={styles.catRail}>
              <div className={styles.catRailLabel}>Categories</div>
              <div className={styles.catList}>
                {visibleCats.map((c) => (
                  <div
                    key={c.key}
                    className={styles.catRow}
                    data-active={c.key === activeCatKey}
                    onClick={() => setFieldPickerCategory(c.key)}
                  >
                    <span className={styles.catLabel}>{c.label}</span>
                    <span className={styles.catBadge}>{c.prims.length}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.content}>
            {mode !== 'schema' && mode !== 'custom' && (
              <>
                <div className={styles.sectionLabel}>{activeCat?.label ?? ''}</div>
                <div className={styles.primGrid}>
                  {primItems.map((p) => {
                    const isSel = selectedKey === p.key;
                    const showTip = hoverKey === p.key;
                    return (
                      <div
                        key={p.key}
                        className={styles.primCard}
                        data-selected={isSel}
                        onClick={() => selectFieldPickerPrimitive(p.key)}
                        onDoubleClick={() => insertPrimitiveField(p.key)}
                        onMouseEnter={() => setHoverKey(p.key)}
                        onMouseLeave={() => setHoverKey(null)}
                        title="Double-click to insert"
                      >
                        <div className={styles.primCardHead}>
                          <span className={styles.primCardKey}>{p.key}</span>
                          <span className={styles.typeBadge} style={{ '--tint': JSON_TYPE_TINT[p.jsonType] ?? '#7c7c8a' } as React.CSSProperties}>
                            {p.jsonType}
                          </span>
                        </div>
                        <div className={styles.primCardDesc}>{p.description}</div>
                        {showTip && (
                          <div className={styles.primTip}>
                            <div className={styles.primTipLabel}>Example</div>
                            <div className={styles.primTipExample}>{exampleText(p.example)}</div>
                            {tipRowsFor(p).map((r) => (
                              <div key={r.k} className={styles.primTipRow}>
                                <span className={styles.primTipK}>{r.k}</span>
                                <span className={styles.primTipV}>{r.v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {primItems.length === 0 && <div className={styles.emptyState}>No primitives match your search.</div>}
                </div>
              </>
            )}

            {mode === 'schema' && (
              <>
                <div className={styles.schemasHeadRow}>
                  <span className={styles.sectionLabel}>Schemas</span>
                  <button type="button" className={styles.newSchemaBtn} onClick={() => addSchemaReturningName()}>
                    + New schema
                  </button>
                </div>
                {addSchemaRows.length === 0 && (
                  <div className={styles.schemasEmpty}>No schemas yet — create one to reference an object here.</div>
                )}
                <div className={styles.schemaList}>
                  {addSchemaRows.map((sc) => (
                    <div key={sc.id} className={styles.schemaRow} onClick={() => insertSchemaRefField(sc.name)}>
                      <span className={styles.schemaRowName}>
                        {sc.scalar && <span className={styles.primitiveBadge}>PRIMITIVE</span>}
                        <span>{sc.name}</span>
                      </span>
                      <span className={styles.schemaRowMeta}>
                        {sc.scalar
                          ? `${sc.scalarType}${sc.scalarFormat ? ` · ${sc.scalarFormat}` : ''}`
                          : `${sc.fields.length} field(s)`}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {mode === 'custom' && (
              <>
                <div className={styles.customHeadRow}>
                  <button type="button" className={styles.backBtn} onClick={() => setFieldPickerMode('primitive')}>
                    <ChevronLeft size={13} /> Back to primitives
                  </button>
                  <span className={styles.sectionLabel}>Define custom property</span>
                </div>
                <div className={styles.customForm}>
                  <div className={styles.customGrid2}>
                    <div>
                      <div className={styles.fieldLabel}>Property name</div>
                      <input
                        className={styles.textInput}
                        value={customDraft.name}
                        onChange={(e) => setCustomFieldDraft({ name: e.target.value })}
                        placeholder="e.g. discountCode"
                      />
                    </div>
                    <div>
                      <div className={styles.fieldLabel}>Type</div>
                      <select
                        className={styles.textInput}
                        value={cType}
                        onChange={(e) => setCustomFieldDraft({ type: e.target.value as SchemaFieldType })}
                      >
                        <option value="string">string</option>
                        <option value="integer">integer</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                        <option value="array">array</option>
                      </select>
                    </div>
                  </div>

                  {isArrT && (
                    <div>
                      <div className={styles.fieldLabel}>Array item type</div>
                      <select
                        className={styles.textInput}
                        value={customDraft.itemsValue}
                        onChange={(e) => setCustomFieldDraft({ itemsValue: e.target.value })}
                      >
                        <option value="prim:string">[string]</option>
                        <option value="prim:integer">[integer]</option>
                        <option value="prim:number">[number]</option>
                        <option value="prim:boolean">[boolean]</option>
                        {arraySchemaOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <div className={styles.fieldLabel}>Format (optional)</div>
                    <input
                      className={styles.textInput}
                      value={customDraft.format}
                      onChange={(e) => setCustomFieldDraft({ format: e.target.value })}
                      placeholder="e.g. custom-thing"
                      list="fieldPickerFormatOptions"
                    />
                    <datalist id="fieldPickerFormatOptions">
                      {formatOptions.map((fo) => (
                        <option key={fo} value={fo} />
                      ))}
                    </datalist>
                  </div>

                  {isStringT && (
                    <div>
                      <div className={styles.fieldLabel}>Pattern (regex, optional)</div>
                      <input
                        className={styles.textInput}
                        value={customDraft.pattern}
                        onChange={(e) => setCustomFieldDraft({ pattern: e.target.value })}
                        placeholder="e.g. ^[A-Z]{3}-\d{4}$"
                      />
                      <div className={styles.patternSuggestions}>
                        {PATTERN_SUGGESTIONS.map((ps) => (
                          <button
                            key={ps.label}
                            type="button"
                            className={styles.patternChip}
                            onClick={() => setCustomFieldDraft({ pattern: ps.pattern })}
                          >
                            {ps.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={styles.customGrid2}>
                    {isStringT && (
                      <div>
                        <div className={styles.fieldLabel}>Min length</div>
                        <input
                          className={styles.textInput}
                          value={customDraft.minLength}
                          onChange={(e) => setCustomFieldDraft({ minLength: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    )}
                    {isStringT && (
                      <div>
                        <div className={styles.fieldLabel}>Max length</div>
                        <input
                          className={styles.textInput}
                          value={customDraft.maxLength}
                          onChange={(e) => setCustomFieldDraft({ maxLength: e.target.value })}
                          placeholder="255"
                        />
                      </div>
                    )}
                    {isNumT && (
                      <div>
                        <div className={styles.fieldLabel}>Minimum</div>
                        <input
                          className={styles.textInput}
                          value={customDraft.min}
                          onChange={(e) => setCustomFieldDraft({ min: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    )}
                    {isNumT && (
                      <div>
                        <div className={styles.fieldLabel}>Maximum</div>
                        <input
                          className={styles.textInput}
                          value={customDraft.max}
                          onChange={(e) => setCustomFieldDraft({ max: e.target.value })}
                          placeholder="100"
                        />
                      </div>
                    )}
                  </div>

                  {isStringT && (
                    <div>
                      <div className={styles.fieldLabel}>Enum values (comma-separated, optional)</div>
                      <input
                        className={styles.textInput}
                        value={customDraft.enumValues}
                        onChange={(e) => setCustomFieldDraft({ enumValues: e.target.value })}
                        placeholder="e.g. draft, active, archived"
                      />
                    </div>
                  )}

                  {!isArrT && (
                    <div>
                      <div className={styles.fieldLabel}>Example</div>
                      <input
                        className={styles.textInput}
                        value={customDraft.example}
                        onChange={(e) => setCustomFieldDraft({ example: e.target.value })}
                        placeholder={examplePlaceholderFor(cType)}
                      />
                    </div>
                  )}

                  <div className={styles.toggleRow}>
                    <button
                      type="button"
                      className={styles.toggleBtn}
                      data-on={customDraft.required}
                      onClick={() => setCustomFieldDraft({ required: !customDraft.required })}
                    >
                      Required
                    </button>
                    <button
                      type="button"
                      className={styles.toggleBtn}
                      data-on={customDraft.nullable}
                      onClick={() => setCustomFieldDraft({ nullable: !customDraft.nullable })}
                    >
                      Nullable
                    </button>
                  </div>

                  <div className={styles.customFooter}>
                    <button type="button" className={styles.addPropertyBtn} disabled={customAddDisabled} onClick={addCustomField}>
                      Add property
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {mode !== 'schema' && mode !== 'custom' && (
          <div className={styles.footerHint}>
            <ChevronRight size={13} />
            Click a primitive to inspect it, or double-click to insert it directly.
          </div>
        )}

        {selectedPrim && selectedPrimCat && (
          <div className={styles.detailScrim} onClick={() => selectFieldPickerPrimitive(null)}>
            <div className={styles.detailDialog} onClick={(e) => e.stopPropagation()}>
              <div className={styles.detailHeader}>
                <div className={styles.detailCategory}>{selectedPrimCat.label}</div>
                <div className={styles.detailKeyRow}>
                  <span className={styles.detailKey}>{selectedPrim.key}</span>
                  <span
                    className={styles.typeBadge}
                    style={{ '--tint': JSON_TYPE_TINT[selectedPrim.jsonType] ?? '#7c7c8a' } as React.CSSProperties}
                  >
                    {selectedPrim.jsonType}
                  </span>
                </div>
                <div className={styles.detailDescription}>{selectedPrim.description}</div>
              </div>
              <div className={styles.detailRows}>
                <div className={styles.detailRow}>
                  <span className={styles.detailRowK}>Type</span>
                  <span className={styles.detailRowV}>{selectedPrim.jsonType}</span>
                </div>
                {selectedPrim.format && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailRowK}>Format</span>
                    <span className={styles.detailRowV}>{selectedPrim.format}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailRowK}>Example</span>
                  <span className={styles.detailRowV}>{exampleText(selectedPrim.example)}</span>
                </div>
                {tipRowsFor(selectedPrim)
                  .filter((r) => r.k !== 'Format')
                  .map((r) => (
                    <div key={r.k} className={styles.detailRow}>
                      <span className={styles.detailRowK}>{r.k === 'Min' ? 'Minimum' : r.k === 'Max' ? 'Maximum' : r.k}</span>
                      <span className={styles.detailRowV}>{r.v}</span>
                    </div>
                  ))}
              </div>
              <div className={styles.detailFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => selectFieldPickerPrimitive(null)}>
                  Cancel
                </button>
                <button type="button" className={styles.okBtn} onClick={() => insertPrimitiveField(selectedPrim.key)}>
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
