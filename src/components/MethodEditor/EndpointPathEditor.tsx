import { useRef, useState } from 'react';
import { useSpecStore } from '../../state/useSpecStore';
import styles from './MethodEditor.module.css';

interface EndpointPathEditorProps {
  path: string;
}

/** The editable suffix beneath a locked parent root must itself start with / and carry at least
 * one more character (no bare "/") — the root's own leading / is never part of this segment. */
function isValidChildSegment(s: string): boolean {
  return /^\/\S*$/.test(s) && s.length > 1;
}

/** The editable segment at the root level excludes the leading / (which is always locked). Empty
 * is valid — that's the bare "/" root endpoint — otherwise it must contain no whitespace. */
function isValidRootSegment(s: string): boolean {
  return s === '' || /^\S+$/.test(s);
}

export function EndpointPathEditor({ path }: EndpointPathEditorProps) {
  const endpoints = useSpecStore((s) => s.endpoints);
  const renamePath = useSpecStore((s) => s.renamePath);
  const [draft, setDraft] = useState<string | null>(null);
  const escapingRef = useRef(false);

  // If another endpoint's path is a strict ancestor of this one, its root is locked — only the
  // suffix beneath it can be edited here; renaming the root itself happens on that other endpoint.
  // Otherwise the leading "/" itself is locked — every path has one, so it's never user-editable.
  const allPaths = [...new Set(endpoints.map((e) => e.path))];
  const ancestors = allPaths.filter((p) => p !== path && path.startsWith(`${p}/`));
  const parentRoot = ancestors.sort((a, b) => b.length - a.length)[0] ?? null;
  const lockedPrefix = parentRoot ?? '/';
  const isValidSegment = parentRoot ? isValidChildSegment : isValidRootSegment;

  const committedSegment = path.slice(lockedPrefix.length);
  const segment = draft ?? committedSegment;
  const fullValue = lockedPrefix + segment;

  const invalidFormat = !isValidSegment(segment);
  const collides = !invalidFormat && fullValue !== path && endpoints.some((e) => e.path === fullValue);
  const invalid = invalidFormat || collides;

  const commit = () => {
    const trimmed = segment.trim();
    if (isValidSegment(trimmed)) {
      const newPath = lockedPrefix + trimmed;
      if (newPath !== path) renamePath(path, newPath);
    }
    setDraft(null);
  };

  return (
    <div className={styles.pathHeadingRow}>
      <div className={styles.pathFieldWrap} data-invalid={invalid}>
        <span
          className={styles.pathRootLocked}
          title={parentRoot ? 'Inherited from the parent endpoint — rename the parent to change this' : undefined}
        >
          {lockedPrefix}
        </span>
        <input
          className={`${styles.pathInput} ${styles.pathInputNoLeftPad}`}
          value={segment}
          placeholder={parentRoot ? '/{id}' : undefined}
          spellCheck={false}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (escapingRef.current) {
              escapingRef.current = false;
              return;
            }
            commit();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              escapingRef.current = true;
              setDraft(null);
              e.currentTarget.blur();
            }
          }}
        />
      </div>
      {invalid && (
        <span
          className={styles.pathBadge}
          title={
            invalidFormat
              ? parentRoot
                ? 'The sub-path must start with / after the inherited root.'
                : 'Path must not be empty or contain spaces.'
              : `Another endpoint already uses ${fullValue}.`
          }
        >
          {invalidFormat ? 'Invalid path' : 'Duplicate path'}
        </span>
      )}
    </div>
  );
}
