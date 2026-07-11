import { useState } from 'react';
import { Tag } from 'lucide-react';
import { useSpecStore } from '../../state/useSpecStore';
import type { Endpoint } from '../../types/spec';
import { RemoveGlyph } from './RemoveGlyph';
import styles from './MethodEditor.module.css';

interface TagsRowProps {
  endpoint: Endpoint;
}

export function TagsRow({ endpoint }: TagsRowProps) {
  const endpoints = useSpecStore((s) => s.endpoints);
  const toggleEndpointTag = useSpecStore((s) => s.toggleEndpointTag);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const allTags = [...new Set(endpoints.flatMap((e) => e.tags))].sort((a, b) => a.localeCompare(b));
  const available = allTags.filter((t) => !endpoint.tags.includes(t));

  const commitDraft = () => {
    const name = draft.trim();
    if (name) toggleEndpointTag(endpoint.id, name);
    setDraft('');
    setAdding(false);
  };

  return (
    <div className={styles.metaRow}>
      <span className={styles.metaLabel}>TAGS:</span>

      {endpoint.tags.length === 0 && (
        <span
          className={styles.defaultChip}
          title="No tag assigned — grouped under the default (untagged) category"
        >
          <span className={styles.chipIcon}>
            <Tag size={12} />
          </span>
          Default
        </span>
      )}

      {endpoint.tags.map((tag) => (
        <span key={tag} className={styles.tagChip}>
          <span className={styles.chipIcon}>
            <Tag size={12} />
          </span>
          {tag}
          <button
            type="button"
            className={styles.chipRemove}
            title="Remove tag"
            onClick={() => toggleEndpointTag(endpoint.id, tag)}
          >
            <RemoveGlyph size={9} />
          </button>
        </span>
      ))}

      <span className={styles.metaSpacer} />

      {adding ? (
        <input
          autoFocus
          className={styles.nameInput}
          style={{ flex: 'none', width: 140 }}
          value={draft}
          list="known-tags"
          placeholder="Tag name…"
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
          + Add tag
        </button>
      )}
      <datalist id="known-tags">
        {available.map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
    </div>
  );
}
