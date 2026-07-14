import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import type { Endpoint } from '../../types/spec';
import { RemoveGlyph } from './RemoveGlyph';
import styles from './MethodEditor.module.css';

interface SecurityRowProps {
  endpoint: Endpoint;
}

export function SecurityRow({ endpoint }: SecurityRowProps) {
  const addSecurity = useSpecStore((s) => s.addSecurity);
  const removeSecurity = useSpecStore((s) => s.removeSecurity);
  const enabledSecuritySchemes = useSpecStore((s) => s.enabledSecuritySchemes);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const suggestions = enabledSecuritySchemes.filter((scheme) => !endpoint.security.includes(scheme));

  const commitDraft = () => {
    const name = draft.trim();
    if (name) addSecurity(endpoint.id, name);
    setDraft('');
    setAdding(false);
  };

  return (
    <div
      className={styles.metaRow}
      title={
        endpoint.security.length
          ? 'Security schemes required to call this operation'
          : 'No security scheme applied — this operation is unauthenticated'
      }
    >
      <span className={styles.metaLabel}>SECURITY:</span>

      {endpoint.security.map((scheme) => (
        <span key={scheme} className={styles.securityChip}>
          <span className={styles.chipIcon}>
            <ShieldCheck size={12} />
          </span>
          {scheme}
          <button
            type="button"
            className={styles.chipRemove}
            title="Remove scheme"
            onClick={() => removeSecurity(endpoint.id, scheme)}
          >
            <RemoveGlyph size={9} />
          </button>
        </span>
      ))}

      {endpoint.security.length === 0 && !adding && <span className={styles.noneChip}>Auth: None</span>}

      <span className={styles.metaSpacer} />

      {adding ? (
        <input
          autoFocus
          className={styles.nameInput}
          style={{ flex: 'none', width: 160 }}
          value={draft}
          list="known-security-schemes"
          placeholder="Scheme name…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitDraft();
            if (e.key === 'Escape') {
              setDraft('');
              setAdding(false);
            }
          }}
          onBlur={commitDraft}
        />
      ) : (
        <button type="button" className={styles.addSelect} onClick={() => setAdding(true)}>
          + Add auth
        </button>
      )}
      <datalist id="known-security-schemes">
        {suggestions.map((scheme) => (
          <option key={scheme} value={scheme} />
        ))}
      </datalist>
    </div>
  );
}
