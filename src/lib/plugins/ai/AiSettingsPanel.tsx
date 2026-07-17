import { useEffect, useState } from 'react';
import { CircleCheck, CircleX, LoaderCircle } from 'lucide-react';
import { fetchAiStatus } from '../../api/ai';
import styles from './AiSettingsPanel.module.css';

type Status = { kind: 'loading' } | { kind: 'available'; model?: string } | { kind: 'unavailable' };

export function AiSettingsPanel() {
  const [status, setStatus] = useState<Status>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetchAiStatus()
      .then((res) => {
        if (!cancelled) setStatus(res.available ? { kind: 'available', model: res.model } : { kind: 'unavailable' });
      })
      .catch(() => {
        if (!cancelled) setStatus({ kind: 'unavailable' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div>
        <div className={styles.title}>AI</div>
        <div className={styles.description}>
          Adds a &quot;Generate with AI&quot; action next to operation summaries, request/response descriptions, and
          schema descriptions. Requests are proxied through the APIforge backend — no model provider API key is ever
          held in your browser.
        </div>
      </div>

      <div>
        <div className={styles.sectionLabel}>Status</div>
        {status.kind === 'loading' && (
          <div className={styles.statusRow}>
            <LoaderCircle size={14} className={styles.spin} />
            Checking connection…
          </div>
        )}
        {status.kind === 'available' && (
          <div className={styles.statusRow} data-tone="ok">
            <CircleCheck size={14} />
            Connected{status.model ? ` · ${status.model}` : ''}
          </div>
        )}
        {status.kind === 'unavailable' && (
          <div className={styles.statusRow} data-tone="error">
            <CircleX size={14} />
            AI isn&apos;t available on this deployment yet.
          </div>
        )}
      </div>
    </>
  );
}
