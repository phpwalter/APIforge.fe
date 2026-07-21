import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { parseOpenApiDocument, OpenApiImportError } from './openapiImport';

export const IMPORT_ACCEPT = '.yaml,.yml,.json,.xml,application/json,text/yaml,application/xml,text/xml';

/**
 * Shared by every "import an OpenAPI file" entry point (empty-state's Import link, Load Project
 * dialog's Import button) — establishes a fresh project named directly from the document's own
 * title, no naming popup, since the title is already known.
 */
export async function importOpenApiFile(file: File): Promise<void> {
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
    useAppStore.getState().startProjectNamed(parsed.title);

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
