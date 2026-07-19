import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { getWorkspace } from './workspaces';
import { parseOpenApiDocument, OpenApiImportError } from './openapiImport';

/**
 * Reopens a workspace saved by the autosave engine (src/lib/workspaceAutosave.ts) — the saved
 * specJson is a real OpenAPI document, so this reuses the exact same parse/import pipeline Import
 * already uses. Sets the workspace identity directly (openExistingWorkspace), skipping the "name
 * this workspace" prompt since the name is already known.
 */
export function openRecentWorkspace(id: string): void {
  const entry = getWorkspace(id);
  if (!entry) return;

  const { setImportStatus, importSpec } = useSpecStore.getState();
  try {
    const parsed = parseOpenApiDocument(entry.specJson, `${entry.name}.json`);
    importSpec({ endpoints: parsed.endpoints, schemas: parsed.schemas });
    useAppStore.getState().setProjectInfo({
      title: parsed.title,
      version: parsed.version,
      openapiVersion: parsed.openapiVersion,
    });
    useAppStore.getState().openExistingWorkspace(entry.id, entry.name);
    setImportStatus({ type: 'success', message: `Reopened ${entry.name}.` });
  } catch (err) {
    const message =
      err instanceof OpenApiImportError
        ? err.message
        : `Couldn't reopen "${entry.name}": ${err instanceof Error ? err.message : String(err)}`;
    setImportStatus({ type: 'error', message });
  }
}
