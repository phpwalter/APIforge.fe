import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, GripVertical, X } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import { resolveFieldExampleHint } from '../../lib/schemaExample';
import type { Schema, SchemaField, SchemaFieldType } from '../../types/spec';
import styles from './SchemaFieldRow.module.css';

interface Props {
  schema: Schema;
  fields: SchemaField[];
  index: number;
  schemas: Schema[];
}

export function SchemaFieldRow({ schema, fields, index, schemas }: Props) {
  const setSchemaField = useSpecStore((s) => s.setSchemaField);
  const setSchemaFieldType = useSpecStore((s) => s.setSchemaFieldType);
  const setSchemaFieldItems = useSpecStore((s) => s.setSchemaFieldItems);
  const removeSchemaField = useSpecStore((s) => s.removeSchemaField);
  const toggleSchemaFieldRequired = useSpecStore((s) => s.toggleSchemaFieldRequired);
  const toggleSchemaFieldNullable = useSpecStore((s) => s.toggleSchemaFieldNullable);
  const indentSchemaField = useSpecStore((s) => s.indentSchemaField);
  const outdentSchemaField = useSpecStore((s) => s.outdentSchemaField);
  const expandedSchemaFieldKey = useSpecStore((s) => s.expandedSchemaFieldKey);
  const toggleSchemaFieldExpanded = useSpecStore((s) => s.toggleSchemaFieldExpanded);
  const draggingSchemaFieldSchemaId = useSpecStore((s) => s.draggingSchemaFieldSchemaId);
  const draggingSchemaFieldIndex = useSpecStore((s) => s.draggingSchemaFieldIndex);
  const dragOverSchemaFieldIndex = useSpecStore((s) => s.dragOverSchemaFieldIndex);
  const startDragSchemaField = useSpecStore((s) => s.startDragSchemaField);
  const setDragOverSchemaField = useSpecStore((s) => s.setDragOverSchemaField);
  const clearDragOverSchemaField = useSpecStore((s) => s.clearDragOverSchemaField);
  const dropSchemaField = useSpecStore((s) => s.dropSchemaField);
  const endDragSchemaField = useSpecStore((s) => s.endDragSchemaField);
  const openFieldPicker = useSpecStore((s) => s.openFieldPicker);

  const f = fields[index];
  const depth = f.depth || 0;
  const nextF = fields[index + 1];
  const hasChildren = !!nextF && (nextF.depth || 0) > depth;
  let directChildCount = 0;
  if (hasChildren) {
    let k = index + 1;
    while (k < fields.length && (fields[k].depth || 0) > depth) {
      if ((fields[k].depth || 0) === depth + 1) directChildCount++;
      k++;
    }
  }
  const prevF = index > 0 ? fields[index - 1] : null;
  const canIndent = !!prevF && (prevF.depth || 0) >= depth;
  const canOutdent = depth > 0;
  const expandKey = `${schema.id}:${index}`;
  const refSchema = f.kind === 'ref' ? schemas.find((sc) => sc.name === f.ref) : undefined;
  const isPrimitiveBackedRef = !!(refSchema?.scalar && refSchema.scalarPrimitiveKey);
  const isExpanded = (f.kind === 'custom' || isPrimitiveBackedRef) && expandedSchemaFieldKey === expandKey;
  const isStringType = f.type === 'string';
  const isNumType = f.type === 'integer' || f.type === 'number';
  const isArrType = f.type === 'array';
  const isReq = f.required === true;
  const isDragging = draggingSchemaFieldSchemaId === schema.id && draggingSchemaFieldIndex === index;
  const isDragOver =
    draggingSchemaFieldSchemaId === schema.id &&
    dragOverSchemaFieldIndex === index &&
    draggingSchemaFieldIndex !== index;
  const showTypeSelect = f.kind === 'custom' && !hasChildren;
  const showExpandToggle = (f.kind === 'custom' || isPrimitiveBackedRef) && !hasChildren;
  const showExampleField = !isArrType && !hasChildren;
  const exampleHint = resolveFieldExampleHint(f, schemas);
  const nameInputOffset = 58;
  const arraySchemaOptions = schemas.filter((sc) => sc.id !== schema.id).map((sc) => ({ value: `ref:${sc.name}`, label: `→ ${sc.name}` }));
  const arrayItemsValue = f.kind === 'custom' && f.itemsRef ? `ref:${f.itemsRef}` : `prim:${f.kind === 'custom' ? f.itemsType || 'string' : 'string'}`;

  return (
    <div className={styles.wrap}>
      <div
        className={styles.row}
        data-drag-over={isDragOver}
        data-dragging={isDragging}
        style={{ marginLeft: depth * 20 }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setDragOverSchemaField(schema.id, index);
        }}
        onDragLeave={() => clearDragOverSchemaField()}
        onDrop={(e) => {
          e.preventDefault();
          dropSchemaField(schema.id, index);
        }}
      >
        <span
          className={styles.grip}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(index));
            startDragSchemaField(schema.id, index);
          }}
          onDragEnd={() => endDragSchemaField()}
          title="Drag to reorder"
        >
          <GripVertical size={13} />
        </span>
        <button
          type="button"
          className={styles.indentBtn}
          disabled={!canOutdent}
          title="Outdent (move up a level)"
          onClick={() => outdentSchemaField(schema.id, index)}
        >
          <ChevronLeft size={10} />
        </button>
        <button
          type="button"
          className={styles.indentBtn}
          disabled={!canIndent}
          title="Indent (make a child of the property above)"
          onClick={() => indentSchemaField(schema.id, index)}
        >
          <ChevronRight size={10} />
        </button>
        <input
          className={styles.nameInput}
          value={f.name}
          onChange={(e) => setSchemaField(schema.id, index, { name: e.target.value })}
          placeholder="propertyName"
        />
        {hasChildren && (
          <span className={styles.containerBadge} title="Contains nested properties">
            {isArrType ? '[ ] ' : '{ } '}
            {directChildCount} propert{directChildCount === 1 ? 'y' : 'ies'}
          </span>
        )}
        {showTypeSelect && (
          <select
            className={styles.typeSelect}
            value={f.type}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '__convert__') {
                openFieldPicker(schema.id, index);
                return;
              }
              setSchemaFieldType(schema.id, index, v as SchemaFieldType);
            }}
          >
            <option value="string">string</option>
            <option value="integer">integer</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="array">array</option>
            <option value="object">object</option>
            <option disabled>──────────</option>
            <option value="__convert__">Convert…</option>
          </select>
        )}
        {f.kind === 'ref' && (
          <button
            type="button"
            className={styles.refBadge}
            title="Change which schema this points to"
            onClick={() => openFieldPicker(schema.id, index)}
          >
            → {f.ref}
          </button>
        )}
        {f.kind === 'primitive' && (
          <span className={styles.primitiveBadge} title="Primitive — locked. Delete and re-add to change.">
            {f.primitiveKey} · {f.type}
          </span>
        )}
        <button
          type="button"
          className={styles.pillBtn}
          data-on={isReq}
          title="Toggle required"
          onClick={() => toggleSchemaFieldRequired(schema.id, index)}
        >
          REQ
        </button>
        <button
          type="button"
          className={styles.pillBtn}
          data-on={!!f.nullable}
          title="Toggle nullable"
          onClick={() => toggleSchemaFieldNullable(schema.id, index)}
        >
          NULL
        </button>
        {showExpandToggle && (
          <button
            type="button"
            className={styles.expandBtn}
            data-on={isExpanded}
            title={f.kind === 'custom' ? 'More validation options' : 'Edit example'}
            onClick={() => toggleSchemaFieldExpanded(schema.id, index)}
          >
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
        <button
          type="button"
          className={styles.removeBtn}
          disabled={isReq}
          title={isReq ? "Required properties can't be removed — toggle off Required first" : 'Remove property'}
          onClick={() => removeSchemaField(schema.id, index)}
        >
          <X size={13} />
        </button>
      </div>

      {exampleHint && !isExpanded && (
        <div className={styles.exampleHint} style={{ paddingLeft: depth * 20 + nameInputOffset }}>
          e.g. {exampleHint}
        </div>
      )}

      {isExpanded && isPrimitiveBackedRef && (
        <div className={styles.advanced} style={{ marginLeft: depth * 20 }}>
          <div className={styles.advField} style={{ minWidth: 140, flex: 2 }}>
            <div className={styles.advLabel}>EXAMPLE</div>
            <input
              className={styles.advInput}
              value={f.example ?? ''}
              onChange={(e) => setSchemaField(schema.id, index, { example: e.target.value })}
              placeholder={exampleHint || '—'}
            />
          </div>
        </div>
      )}

      {isExpanded && f.kind === 'custom' && (
        <div className={styles.advanced} style={{ marginLeft: depth * 20 }}>
          <div className={styles.advField} style={{ minWidth: 120, flex: 1 }}>
            <div className={styles.advLabel}>FORMAT</div>
            <input
              className={styles.advInput}
              value={f.format || ''}
              onChange={(e) => setSchemaField(schema.id, index, { format: e.target.value })}
              placeholder="—"
              list="schemaFieldFormatOptionsList"
            />
          </div>
          {isStringType && (
            <>
              <div className={styles.advField} style={{ minWidth: 170, flex: 2 }}>
                <div className={styles.advLabel}>PATTERN</div>
                <input
                  className={styles.advInput}
                  value={f.pattern || ''}
                  onChange={(e) => setSchemaField(schema.id, index, { pattern: e.target.value })}
                  placeholder="regex"
                />
              </div>
              <div className={styles.advField} style={{ width: 76, flex: 'none' }}>
                <div className={styles.advLabel}>MIN LEN</div>
                <input
                  className={styles.advInput}
                  value={f.minLength ?? ''}
                  onChange={(e) => setSchemaField(schema.id, index, { minLength: e.target.value })}
                  placeholder="—"
                />
              </div>
              <div className={styles.advField} style={{ width: 76, flex: 'none' }}>
                <div className={styles.advLabel}>MAX LEN</div>
                <input
                  className={styles.advInput}
                  value={f.maxLength ?? ''}
                  onChange={(e) => setSchemaField(schema.id, index, { maxLength: e.target.value })}
                  placeholder="—"
                />
              </div>
              <div className={styles.advField} style={{ minWidth: 160, flex: 2 }}>
                <div className={styles.advLabel}>ENUM (comma-sep)</div>
                <input
                  className={styles.advInput}
                  value={f.enumValues ?? ''}
                  onChange={(e) => setSchemaField(schema.id, index, { enumValues: e.target.value })}
                  placeholder="—"
                />
              </div>
            </>
          )}
          {isArrType && (
            <div className={styles.advField} style={{ minWidth: 130, flex: 2 }}>
              <div className={styles.advLabel}>ITEM TYPE</div>
              <select
                className={styles.advSelect}
                value={arrayItemsValue}
                onChange={(e) => setSchemaFieldItems(schema.id, index, e.target.value)}
              >
                <option value="prim:string">[string]</option>
                <option value="prim:integer">[integer]</option>
                <option value="prim:number">[number]</option>
                <option value="prim:boolean">[boolean]</option>
                <option value="prim:object">[object]</option>
                {arraySchemaOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {isNumType && (
            <>
              <div className={styles.advField} style={{ width: 90, flex: 'none' }}>
                <div className={styles.advLabel}>MIN</div>
                <input
                  className={styles.advInput}
                  value={f.min ?? ''}
                  onChange={(e) => setSchemaField(schema.id, index, { min: e.target.value })}
                  placeholder="—"
                />
              </div>
              <div className={styles.advField} style={{ width: 90, flex: 'none' }}>
                <div className={styles.advLabel}>MAX</div>
                <input
                  className={styles.advInput}
                  value={f.max ?? ''}
                  onChange={(e) => setSchemaField(schema.id, index, { max: e.target.value })}
                  placeholder="—"
                />
              </div>
            </>
          )}
          {showExampleField && (
            <div className={styles.advField} style={{ minWidth: 140, flex: 2 }}>
              <div className={styles.advLabel}>EXAMPLE</div>
              <input
                className={styles.advInput}
                value={f.example ?? ''}
                onChange={(e) => setSchemaField(schema.id, index, { example: e.target.value })}
                placeholder="—"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
