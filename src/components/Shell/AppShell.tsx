import { useEffect } from 'react';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { initWorkspaceAutosave } from '../../lib/workspaceAutosave';
import { Topbar } from '../Topbar/Topbar';
import { CanvasHeader } from '../CanvasHeader/CanvasHeader';
import { DesignCanvas } from '../DesignCanvas/DesignCanvas';
import { SchemaDesignerCanvas } from '../SchemaDesignerCanvas/SchemaDesignerCanvas';
import { RestProjectionCanvas } from '../RestProjectionCanvas/RestProjectionCanvas';
import { SettingsModal } from '../SettingsModal/SettingsModal';
import { ExportModal } from '../ExportModal/ExportModal';
import { DocDialog } from '../DocDialog/DocDialog';
import { ProfileModal } from '../Profile/ProfileModal';
import { WorkspaceNameModal } from '../Workspace/WorkspaceNameModal';
import { WorkspaceSettingsModal } from '../Workspace/WorkspaceSettingsModal';
import { WorkspaceFromVersionControlModal } from '../Workspace/WorkspaceFromVersionControlModal';
import { UnsavedChangesModal } from '../Workspace/UnsavedChangesModal';
import { LoadWorkspaceDialog } from '../Workspace/LoadWorkspaceDialog';
import { EmptyProjectState } from '../EmptyProjectState/EmptyProjectState';
import { ImportStatusToast } from '../ImportStatusToast/ImportStatusToast';
import shellStyles from './AppShell.module.css';

const TAB_LABELS: Record<string, string> = {
  swagger: 'Swagger',
  diagnostics: 'Diagnostics',
};

export function AppShell() {
  const theme = useAppStore((s) => s.theme);
  const canvasTab = useAppStore((s) => s.canvasTab);
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const exportOpen = useAppStore((s) => s.exportOpen);
  const docDialogOpen = useAppStore((s) => s.docDialogOpen);
  const profileOpen = useAppStore((s) => s.profileOpen);
  const workspaceNamePromptOpen = useAppStore((s) => s.workspaceNamePromptOpen);
  const workspaceSettingsOpen = useAppStore((s) => s.workspaceSettingsOpen);
  const workspaceFromVersionControlOpen = useAppStore((s) => s.workspaceFromVersionControlOpen);
  const unsavedChangesPromptOpen = useAppStore((s) => s.unsavedChangesPromptOpen);
  const loadWorkspaceOpen = useAppStore((s) => s.loadWorkspaceOpen);
  const hasDocument = useSpecStore((s) => s.hasDocument);

  useEffect(() => {
    initWorkspaceAutosave();
  }, []);

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
              {canvasTab === 'rest' && <RestProjectionCanvas />}
              {canvasTab !== 'design' && canvasTab !== 'schema' && canvasTab !== 'rest' && (
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
      {docDialogOpen && <DocDialog />}
      {profileOpen && <ProfileModal />}
      {workspaceNamePromptOpen && <WorkspaceNameModal />}
      {workspaceSettingsOpen && <WorkspaceSettingsModal />}
      {workspaceFromVersionControlOpen && <WorkspaceFromVersionControlModal />}
      {unsavedChangesPromptOpen && <UnsavedChangesModal />}
      {loadWorkspaceOpen && <LoadWorkspaceDialog />}
    </div>
  );
}
