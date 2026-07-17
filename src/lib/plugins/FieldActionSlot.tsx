import { useState } from 'react';
import { LoaderCircle, CircleAlert } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { getFieldActions } from './registry';
import type { FieldSlot, PluginFieldAction } from './types';
import styles from './FieldActionSlot.module.css';

interface FieldActionSlotProps {
  slot: FieldSlot;
  value: string;
  onChange: (value: string) => void;
  /** Extra context a plugin's prompt-builder can use (e.g. { method, path }) — see types.ts. */
  hints?: Record<string, string>;
}

type RunState = 'idle' | 'running' | 'error';

/** Renders nothing when no enabled plugin has registered an action for this slot. */
export function FieldActionSlot({ slot, value, onChange, hints = {} }: FieldActionSlotProps) {
  const enabledPluginIds = useAppStore((s) => s.enabledPluginIds);
  const [runState, setRunState] = useState<RunState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const actions = getFieldActions(slot, enabledPluginIds);
  if (actions.length === 0) return null;

  const run = async (action: PluginFieldAction) => {
    setRunState('running');
    try {
      const next = await action.run({ slot, value, hints });
      onChange(next);
      setRunState('idle');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
      setRunState('error');
    }
  };

  return (
    <>
      {actions.map((action) => {
        const Icon = runState === 'running' ? LoaderCircle : runState === 'error' ? CircleAlert : action.icon;
        return (
          <button
            key={action.id}
            type="button"
            className={styles.actionBtn}
            data-state={runState}
            disabled={runState === 'running'}
            title={runState === 'error' ? errorMessage : action.label}
            onClick={() => run(action)}
          >
            <Icon size={13} className={runState === 'running' ? styles.spin : undefined} />
          </button>
        );
      })}
    </>
  );
}
