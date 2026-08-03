import type { HttpMethod } from '../../types/spec';
import { useSpecStore } from '../../state/useSpecStore';
import { useAppStore } from '../../state/useAppStore';
import { METHOD_PRIORITY, methodColor, methodIcon } from '../../lib/methodStyle';
import styles from './MethodEditor.module.css';

interface MethodPillsProps {
  path: string;
  activeMethod?: HttpMethod;
}

export function MethodPills({ path, activeMethod }: MethodPillsProps) {
  const endpoints = useSpecStore((s) => s.endpoints);
  const pickMethod = useSpecStore((s) => s.pickMethod);
  const companyId = useAppStore((s) => s.userProfile.companyId);
  const planCode = useAppStore((s) => s.userProfile.planCode);
  const projectId = useAppStore((s) => s.currentProjectId);

  const existing = new Set(endpoints.filter((e) => e.path === path).map((e) => e.method));

  return (
    <div className={styles.pills}>
      {METHOD_PRIORITY.map((method) => {
        const Icon = methodIcon(method);
        const isExisting = existing.has(method);
        return (
          <button
            key={method}
            type="button"
            className={isExisting ? `${styles.pill} ${styles.pillExisting}` : styles.pillAvailable}
            data-active={isExisting && method === activeMethod}
            style={isExisting ? { background: methodColor(method) } : undefined}
            title={isExisting ? `${method} (currently editing)` : `${method} — click to add`}
            onClick={() => void pickMethod(path, method, { companyId, projectId, planCode })}
          >
            <Icon size={13} />
            {method}
          </button>
        );
      })}
    </div>
  );
}
