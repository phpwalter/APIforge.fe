import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { hasSavableContent } from './projectEligibility';

/**
 * Topbar :: More actions :: New Project — a blank, ready-to-edit document (not the empty
 * "no document loaded" state; you land straight in the Design Canvas), prompted for a name.
 */
export function createNewProject(): void {
  useSpecStore.getState().importSpec({ endpoints: [], schemas: [] });
  useAppStore.getState().setProjectInfo({ title: 'Untitled API', version: '1.0.0', openapiVersion: '3.1.0' });
  useAppStore.getState().startProject('Untitled API');
}

/**
 * New Project's actual entry point — guards createNewProject() behind an unsaved-changes
 * check first. Local autosave and Export don't count as "saved"; only a real server save would
 * (not built yet), so this fires whenever a document is loaded AND has savable content (see
 * src/lib/projectEligibility.ts) — an untitled, contentless project has nothing worth
 * protecting, so it's wiped without asking.
 */
export function requestNewProject(): void {
  if (useSpecStore.getState().hasDocument && hasSavableContent()) {
    useAppStore.getState().openUnsavedChangesPrompt();
  } else {
    createNewProject();
  }
}
