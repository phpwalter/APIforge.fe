import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { renderMarkdown } from '../../lib/simpleMarkdown';
import styles from './DocDialog.module.css';

type FetchState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; text: string };

/** Generic reviewer for the footer/About markdown links (Terms, Privacy, Security, Community, Contact, PPI). */
export function DocDialog() {
  const title = useAppStore((s) => s.docDialogTitle);
  const src = useAppStore((s) => s.docDialogSrc);
  const closeDocDialog = useAppStore((s) => s.closeDocDialog);

  const [state, setState] = useState<FetchState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setState({ status: 'ready', text });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDocDialog();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeDocDialog]);

  return (
    <div className={styles.scrim} onClick={closeDocDialog}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <button type="button" className={styles.closeBtn} title="Close" onClick={closeDocDialog}>
            <X size={15} />
          </button>
        </div>
        <div className={styles.body}>
          {state.status === 'loading' && <div className={styles.stateMessage}>Loading…</div>}
          {state.status === 'error' && <div className={styles.stateMessage}>Couldn&apos;t load this document.</div>}
          {state.status === 'ready' && <div className={styles.content}>{renderMarkdown(state.text)}</div>}
        </div>
      </div>
    </div>
  );
}
