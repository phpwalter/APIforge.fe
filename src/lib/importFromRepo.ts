import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import { parseOpenApiDocument, OpenApiImportError } from './openapiImport';
import type { GithubFileContent } from './api/repos';

/**
 * Imports an OpenAPI document fetched from a repo file (Project from Version Control) — reuses
 * the same parse/import pipeline Import already uses, decoding the base64 content GitHub's own
 * Contents API returns (see docs/version-control-api-proposal.md).
 */
export function importFromGithubFile(file: GithubFileContent): void {
  const { setImportStatus, importSpec } = useSpecStore.getState();
  const text = file.encoding === 'base64' ? atob(file.content) : file.content;
  try {
    const parsed = parseOpenApiDocument(text, file.name);
    importSpec({ endpoints: parsed.endpoints, schemas: parsed.schemas });
    useAppStore.getState().setProjectInfo({
      title: parsed.title,
      version: parsed.version,
      openapiVersion: parsed.openapiVersion,
    });
    useAppStore.getState().startProjectNamed(parsed.title);
    setImportStatus({ type: 'success', message: `Imported ${parsed.title} from ${file.path}.` });
  } catch (err) {
    const message =
      err instanceof OpenApiImportError
        ? err.message
        : `Couldn't import "${file.name}": ${err instanceof Error ? err.message : String(err)}`;
    setImportStatus({ type: 'error', message });
    throw err;
  }
}
