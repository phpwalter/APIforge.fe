import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { Topbar } from '../Topbar/Topbar';
import { CanvasHeader } from '../CanvasHeader/CanvasHeader';
import { DesignCanvas } from '../DesignCanvas/DesignCanvas';
import { SchemaDesignerCanvas } from '../SchemaDesignerCanvas/SchemaDesignerCanvas';
import { SettingsModal } from '../SettingsModal/SettingsModal';
import { ExportModal } from '../ExportModal/ExportModal';
import { EmptyProjectState } from '../EmptyProjectState/EmptyProjectState';
import { ImportStatusToast } from '../ImportStatusToast/ImportStatusToast';
import shellStyles from './AppShell.module.css';

const TAB_LABELS: Record<string, string> = {
  rest: 'REST Projection',
  swagger: 'Swagger',
  diagnostics: 'Diagnostics',
};

export function AppShell() {
  const theme = useAppStore((s) => s.theme);
  const canvasTab = useAppStore((s) => s.canvasTab);
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const exportOpen = useAppStore((s) => s.exportOpen);
  const hasDocument = useSpecStore((s) => s.hasDocument);

  return (
    <div className={`app ${shellStyles.app}`} data-theme={theme}>
      <Topbar />
      <div className={shellStyles.body}>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          {hasDocument ? (
            <>
              <CanvasHeader />
              {canvasTab === 'design' && <DesignCanvas />}
              {canvasTab === 'schema' && <SchemaDesignerCanvas />}
              {canvasTab !== 'design' && canvasTab !== 'schema' && (
                <div className={shellStyles.placeholder}>{TAB_LABELS[canvasTab]} panel comes next.</div>
              )}
            </>
          ) : (
            <EmptyProjectState />
          )}
        </main>
      </div>
      <ImportStatusToast />
      {settingsOpen && <SettingsModal />}
      {exportOpen && <ExportModal />}
    </div>
  );
}
