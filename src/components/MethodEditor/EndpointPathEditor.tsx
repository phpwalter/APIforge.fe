import { useRef, useState } from 'react';
import { useSpecStore } from '../../state/useSpecStore';
import styles from './MethodEditor.module.css';

interface EndpointPathEditorProps {
  path: string;
}

/** A path segment is valid standalone, or as the editable suffix after a locked root — both must
 * start with / and carry at least one more character (no bare "/"). */
function isValidSegment(s: string): boolean {
  return /^\/\S*$/.test(s) && s.length > 1;
}

export function EndpointPathEditor({ path }: EndpointPathEditorProps) {
  const endpoints = useSpecStore((s) => s.endpoints);
  const renamePath = useSpecStore((s) => s.renamePath);
  const [draft, setDraft] = useState<string | null>(null);
  const escapingRef = useRef(false);

  // If another endpoint's path is a strict ancestor of this one, its root is locked — only the
  // suffix beneath it can be edited here; renaming the root itself happens on that other endpoint.
  const allPaths = [...new Set(endpoints.map((e) => e.path))];
  const ancestors = allPaths.filter((p) => p !== path && path.startsWith(`${p}/`));
  const parentRoot = ancestors.sort((a, b) => b.length - a.length)[0] ?? null;

  const committedSegment = parentRoot ? path.slice(parentRoot.length) : path;
  const segment = draft ?? committedSegment;
  const fullValue = parentRoot ? parentRoot + segment : segment;

  const invalidFormat = !isValidSegment(segment);
  const collides = !invalidFormat && fullValue !== path && endpoints.some((e) => e.path === fullValue);
  const invalid = invalidFormat || collides;

  const commit = () => {
    const trimmed = segment.trim();
    if (isValidSegment(trimmed)) {
      const newPath = parentRoot ? parentRoot + trimmed : trimmed;
      if (newPath !== path) renamePath(path, newPath);
    }
    setDraft(null);
  };

  return (
    <div className={styles.pathHeadingRow}>
      <div className={styles.pathFieldWrap} data-invalid={invalid}>
        {parentRoot && (
          <span
            className={styles.pathRootLocked}
            title="Inherited from the parent endpoint — rename the parent to change this"
          >
            {parentRoot}
          </span>
        )}
        <input
          className={parentRoot ? `${styles.pathInput} ${styles.pathInputNoLeftPad}` : styles.pathInput}
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
                : 'Path must start with / and contain no spaces.'
              : `Another endpoint already uses ${fullValue}.`
          }
        >
          {invalidFormat ? 'Invalid path' : 'Duplicate path'}
        </span>
      )}
    </div>
  );
}
