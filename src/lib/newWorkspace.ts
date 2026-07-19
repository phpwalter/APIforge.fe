import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';

/**
 * Topbar :: More actions :: New Workspace — a blank, ready-to-edit document (not the empty
 * "no document loaded" state; you land straight in the Design Canvas), prompted for a name.
 */
export function createNewWorkspace(): void {
  useSpecStore.getState().importSpec({ endpoints: [], schemas: [] });
  useAppStore.getState().setProjectInfo({ title: 'Untitled API', version: '1.0.0', openapiVersion: '3.1.0' });
  useAppStore.getState().startWorkspace('Untitled API');
}
