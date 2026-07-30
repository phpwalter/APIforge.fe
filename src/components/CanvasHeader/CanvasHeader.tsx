import { Route, Braces, Code, ListTree, TriangleAlert, Check } from 'lucide-react';
import type { ComponentType } from 'react';
import { useAppStore } from '../../state/useAppStore';
import type { CanvasTabDef, CanvasTabId } from '../../types/ui';
import styles from './CanvasHeader.module.css';

const TABS: CanvasTabDef[] = [
  { id: 'design', label: 'Design Canvas' },
  { id: 'schema', label: 'Schema Designer' },
  { id: 'rest', label: 'REST Projection' },
  { id: 'swagger', label: 'Swagger' },
  { id: 'diagnostics', label: 'Diagnostics' },
];

const TAB_ICONS: Record<CanvasTabId, ComponentType<{ size?: number | string }>> = {
  design: Route,
  schema: Braces,
  rest: Code,
  swagger: ListTree,
  diagnostics: TriangleAlert,
};

function complianceLevel(pct: number): 'good' | 'ok' | 'bad' {
  if (pct >= 90) return 'good';
  if (pct >= 70) return 'ok';
  return 'bad';
}

export function CanvasHeader() {
  const canvasTab = useAppStore((s) => s.canvasTab);
  const setCanvasTab = useAppStore((s) => s.setCanvasTab);
  const compliancePct = useAppStore((s) => s.compliancePct);
  const errorCount = useAppStore((s) => s.errorCount);
  const warnCount = useAppStore((s) => s.warnCount);

  const goToDiagnostics = () => setCanvasTab('diagnostics');

  const issuesLevel = errorCount > 0 ? 'error' : warnCount > 0 ? 'warn' : 'clear';
  const issuesLabel =
    errorCount > 0
      ? `${errorCount + warnCount} issue${errorCount + warnCount !== 1 ? 's' : ''}`
      : warnCount > 0
        ? `${warnCount} warning${warnCount !== 1 ? 's' : ''}`
        : 'All clear';
  const IssuesIcon = errorCount > 0 || warnCount > 0 ? TriangleAlert : Check;

  return (
    <div className={styles.header}>
      <div className={styles.tabs}>
        {TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              className={styles.tab}
              data-active={canvasTab === tab.id}
              onClick={() => setCanvasTab(tab.id)}
            >
              <span style={{ display: 'flex' }}>
                <Icon size={14} />
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className={styles.spacer} />

      <button
        type="button"
        className={styles.complianceBadge}
        title={`Policy Compliance: ${compliancePct}%`}
        onClick={goToDiagnostics}
      >
        <span className={styles.complianceDot} data-level={complianceLevel(compliancePct)} />
        <span className={styles.complianceValue}>{compliancePct}%</span>
      </button>

      <button
        type="button"
        className={styles.issuesBadge}
        data-level={issuesLevel}
        title="Open Diagnostics"
        onClick={goToDiagnostics}
      >
        <span className={styles.issuesIcon}>
          <IssuesIcon size={13} />
        </span>
        <span>{issuesLabel}</span>
      </button>
    </div>
  );
}