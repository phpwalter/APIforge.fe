import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { hasSavableContent } from './workspaceEligibility';

/**
 * Topbar :: More actions :: New Workspace — a blank, ready-to-edit document (not the empty
 * "no document loaded" state; you land straight in the Design Canvas), prompted for a name.
 */
export function createNewWorkspace(): void {
  useSpecStore.getState().importSpec({ endpoints: [], schemas: [] });
  useAppStore.getState().setProjectInfo({ title: 'Untitled API', version: '1.0.0', openapiVersion: '3.1.0' });
  useAppStore.getState().startWorkspace('Untitled API');
}

/**
 * New Workspace's actual entry point — guards createNewWorkspace() behind an unsaved-changes
 * check first. Local autosave and Export don't count as "saved"; only a real server save would
 * (not built yet), so this fires whenever a document is loaded AND has savable content (see
 * src/lib/workspaceEligibility.ts) — an untitled, contentless workspace has nothing worth
 * protecting, so it's wiped without asking.
 */
export function requestNewWorkspace(): void {
  if (useSpecStore.getState().hasDocument && hasSavableContent()) {
    useAppStore.getState().openUnsavedChangesPrompt();
  } else {
    createNewWorkspace();
  }
}
