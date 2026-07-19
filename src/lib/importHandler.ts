import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { parseOpenApiDocument, OpenApiImportError } from './openapiImport';

export const IMPORT_ACCEPT = '.yaml,.yml,.json,.xml,application/json,text/yaml,application/xml,text/xml';

async function doImport(file: File, startProject: (defaultTitle: string) => void): Promise<void> {
  const { setImportStatus, importSpec } = useSpecStore.getState();
  try {
    const text = await file.text();
    const parsed = parseOpenApiDocument(text, file.name);

    importSpec({ endpoints: parsed.endpoints, schemas: parsed.schemas });
    useAppStore.getState().setProjectInfo({
      title: parsed.title,
      version: parsed.version,
      openapiVersion: parsed.openapiVersion,
    });
    startProject(parsed.title);

    setImportStatus({
      type: 'success',
      message: `Imported ${parsed.title} — ${parsed.endpoints.length} operation${parsed.endpoints.length === 1 ? '' : 's'}, ${parsed.schemas.length} schema${parsed.schemas.length === 1 ? '' : 's'}.`,
    });
  } catch (err) {
    const message =
      err instanceof OpenApiImportError
        ? err.message
        : `Unexpected error reading "${file.name}": ${err instanceof Error ? err.message : String(err)}`;
    setImportStatus({ type: 'error', message });
  }
}

/**
 * Establishes a fresh project for this import — see Settings :: Plugins-adjacent Recent
 * Projects / autosave (src/lib/projectAutosave.ts). Defaults the name prompt to the
 * document's own title, editable before it's saved.
 */
export async function importOpenApiFile(file: File): Promise<void> {
  return doImport(file, (title) => useAppStore.getState().startProject(title));
}

/**
 * Load Project dialog's "Import OpenAPI Document" button — same import pipeline, but drops
 * straight into Project Settings :: General (prefilled with the document's own title) instead
 * of the small naming popup.
 */
export async function importOpenApiFileIntoSettings(file: File): Promise<void> {
  return doImport(file, (title) => useAppStore.getState().startProjectIntoSettings(title));
}
