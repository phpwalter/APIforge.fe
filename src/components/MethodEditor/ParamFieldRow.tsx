import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type { ParamLocation } from '../../types/spec';
import styles from './MethodEditor.module.css';

const LOCATIONS: ParamLocation[] = ['query', 'path', 'header', 'cookie'];

interface ParamFieldRowProps {
  name: string;
  onNameChange: (v: string) => void;
  namePlaceholder: string;
  nameDisabled?: boolean;

  location?: ParamLocation;
  onLocationChange?: (v: ParamLocation) => void;

  required: boolean;
  onToggleRequired: () => void;
  requiredDisabled?: boolean;
  requiredTitle?: string;

  nullable: boolean;
  onToggleNullable: () => void;

  example: string;
  onExampleChange: (v: string) => void;

  expanded: boolean;
  onToggleExpand: () => void;

  removeDisabled?: boolean;
  removeTitle?: string;
  onRemove: () => void;
}

/** A single parameter/header row shared by the Request Parameters, Request Headers, and Response
 * Headers boxes — mirrors Schema Designer's REQ/NULL pills, expand-for-example affordance, and
 * disable-on-required guards so the endpoint editor matches the schema field editor exactly. */
export function ParamFieldRow({
  name,
  onNameChange,
  namePlaceholder,
  nameDisabled,
  location,
  onLocationChange,
  required,
  onToggleRequired,
  requiredDisabled,
  requiredTitle,
  nullable,
  onToggleNullable,
  example,
  onExampleChange,
  expanded,
  onToggleExpand,
  removeDisabled,
  removeTitle,
  onRemove,
}: ParamFieldRowProps) {
  return (
    <div className={styles.paramRowWrap}>
      <div className={styles.fieldRow}>
        <input
          className={styles.nameInput}
          value={name}
          placeholder={namePlaceholder}
          disabled={nameDisabled}
          onChange={(e) => onNameChange(e.target.value)}
        />
        {location && onLocationChange && (
          <select className={styles.locSelect} value={location} onChange={(e) => onLocationChange(e.target.value as ParamLocation)}>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          className={styles.pillBtn}
          data-on={required}
          disabled={requiredDisabled}
          title={requiredTitle ?? 'Toggle required'}
          onClick={onToggleRequired}
        >
          REQ
        </button>
        <button
          type="button"
          className={styles.pillBtn}
          data-on={nullable}
          disabled={required}
          title="Toggle nullable"
          onClick={onToggleNullable}
        >
          NULL
        </button>
        <button
          type="button"
          className={styles.expandBtn}
          data-on={expanded}
          title="Edit example"
          onClick={onToggleExpand}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        <button
          type="button"
          className={styles.removeBtn}
          disabled={removeDisabled}
          title={removeTitle ?? 'Remove'}
          onClick={onRemove}
        >
          <X size={13} />
        </button>
      </div>
      {example && !expanded && <div className={styles.exampleHint}>e.g. {example}</div>}
      {expanded && (
        <div className={styles.advanced}>
          <div className={styles.advField} style={{ minWidth: 200, flex: 1 }}>
            <div className={styles.advLabel}>EXAMPLE</div>
            <input
              className={styles.advInput}
              value={example}
              onChange={(e) => onExampleChange(e.target.value)}
              placeholder="—"
            />
          </div>
        </div>
      )}
    </div>
  );
}
