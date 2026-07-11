import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { parseOpenApiDocument, OpenApiImportError } from './openapiImport';

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
