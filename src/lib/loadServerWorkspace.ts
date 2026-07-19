import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { getServerWorkspace } from './api/workspaces';
import { parseOpenApiDocument } from './openapiImport';

/**
 * Load Workspace dialog's "Open" action for a server-listed project — fetches the full document
 * (GET /workspaces/:id, not yet built — see docs/workspace-server-storage-api-proposal.md), then
 * reuses the same parse/import pipeline Import already uses, and drops straight into Workspace
 * Settings :: General so the loaded data is immediately visible.
 */
export async function openServerWorkspaceIntoSettings(id: string): Promise<void> {
  const { setImportStatus, importSpec } = useSpecStore.getState();
  try {
    const entry = await getServerWorkspace(id);
    const parsed = parseOpenApiDocument(entry.specJson, `${entry.name}.json`);
    importSpec({ endpoints: parsed.endpoints, schemas: parsed.schemas });
    useAppStore.getState().setProjectInfo({
      title: parsed.title,
      version: parsed.version,
      openapiVersion: parsed.openapiVersion,
    });
    useAppStore.getState().openExistingWorkspaceIntoSettings(entry.id, entry.name);
    setImportStatus({ type: 'success', message: `Loaded ${entry.name}.` });
  } catch (err) {
    setImportStatus({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
