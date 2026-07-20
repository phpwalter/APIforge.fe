import { useEffect } from 'react';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { initProjectAutosave } from '../../lib/projectAutosave';
import { Topbar } from '../Topbar/Topbar';
import { CanvasHeader } from '../CanvasHeader/CanvasHeader';
import { DesignCanvas } from '../DesignCanvas/DesignCanvas';
import { SchemaDesignerCanvas } from '../SchemaDesignerCanvas/SchemaDesignerCanvas';
import { RestProjectionCanvas } from '../RestProjectionCanvas/RestProjectionCanvas';
import { SettingsModal } from '../SettingsModal/SettingsModal';
import { ExportModal } from '../ExportModal/ExportModal';
import { DocDialog } from '../DocDialog/DocDialog';
import { ProfileModal } from '../Profile/ProfileModal';
import { ProjectNameModal } from '../Project/ProjectNameModal';
import { ProjectSettingsModal } from '../Project/ProjectSettingsModal';
import { ProjectFromVersionControlModal } from '../Project/ProjectFromVersionControlModal';
import { UnsavedChangesModal } from '../Project/UnsavedChangesModal';
import { LoadProjectDialog } from '../Project/LoadProjectDialog';
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
  const projectNamePromptOpen = useAppStore((s) => s.projectNamePromptOpen);
  const projectSettingsOpen = useAppStore((s) => s.projectSettingsOpen);
  const projectFromVersionControlOpen = useAppStore((s) => s.projectFromVersionControlOpen);
  const unsavedChangesPromptOpen = useAppStore((s) => s.unsavedChangesPromptOpen);
  const loadProjectOpen = useAppStore((s) => s.loadProjectOpen);
  const currentProjectName = useAppStore((s) => s.currentProjectName);
  const hasDocument = useSpecStore((s) => s.hasDocument);
  // A brand-new/imported project already has real content (spec store, id) the moment its
  // source action runs, but isn't shown here until it's actually named — see
  // src/components/Project/ProjectNameModal.tsx. Until then this stays on the empty state, with
  // the naming prompt as the only thing visible on top of it.
  const hasNamedProject = hasDocument && currentProjectName !== null;

  useEffect(() => {
    initProjectAutosave();
  }, []);

  return (
    <div className={`app ${shellStyles.app}`} data-theme={theme}>
      <Topbar />
      <div className={shellStyles.body}>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          {hasNamedProject ? (
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
      {projectNamePromptOpen && <ProjectNameModal />}
      {projectSettingsOpen && <ProjectSettingsModal />}
      {projectFromVersionControlOpen && <ProjectFromVersionControlModal />}
      {unsavedChangesPromptOpen && <UnsavedChangesModal />}
      {loadProjectOpen && <LoadProjectDialog />}
    </div>
  );
}
