import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { getServerProject } from './api/projects';
import { parseOpenApiDocument } from './openapiImport';

/**
 * Load Project dialog's "Open" action for a server-listed project — fetches the full document
 * (GET /projects/:id, not yet built — see docs/project-server-storage-api-proposal.md), then
 * reuses the same parse/import pipeline Import already uses, and drops straight into Project
 * Settings :: General so the loaded data is immediately visible.
 */
export async function openServerProjectIntoSettings(id: string): Promise<void> {
  const { setImportStatus, importSpec } = useSpecStore.getState();
  try {
    const entry = await getServerProject(id);
    const parsed = parseOpenApiDocument(entry.specJson, `${entry.name}.json`);
    importSpec({ endpoints: parsed.endpoints, schemas: parsed.schemas });
    useAppStore.getState().setProjectInfo({
      title: parsed.title,
      version: parsed.version,
      openapiVersion: parsed.openapiVersion,
    });
    useAppStore.getState().openExistingProjectIntoSettings(entry.id, entry.name);
    setImportStatus({ type: 'success', message: `Loaded ${entry.name}.` });
  } catch (err) {
    setImportStatus({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
