import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { parseOpenApiDocument, OpenApiImportError } from './openapiImport';
import type { RestProjectionFormat } from '../types/ui';

const FILENAME_FOR_FORMAT: Record<RestProjectionFormat, string> = {
  yaml: 'openapi.yaml',
  json: 'openapi.json',
};

/**
 * Commits a hand-edited REST Projection doc back into the canvas model — the same
 * parse → importSpec → setProjectInfo pipeline `importHandler.ts` uses for a dropped file,
 * so a projection edit behaves exactly like importing a new document. On success this clears
 * every format's pending manual edit (both views regenerate from the new model); on
 * failure the edit is left in place and the parse error is surfaced in the footer.
 */
export function commitRestProjectionEdit(text: string, format: RestProjectionFormat): void {
  try {
    const parsed = parseOpenApiDocument(text, FILENAME_FOR_FORMAT[format]);
    useSpecStore.getState().importSpec({ endpoints: parsed.endpoints, schemas: parsed.schemas });
    useAppStore.getState().setProjectInfo({
      title: parsed.title,
      version: parsed.version,
      openapiVersion: parsed.openapiVersion,
    });
    useAppStore.getState().clearRestProjectionManual();
  } catch (err) {
    const message =
      err instanceof OpenApiImportError
        ? err.message
        : `Could not parse this document: ${err instanceof Error ? err.message : String(err)}`;
    useAppStore.getState().setRestProjectionError(message);
  }
}
