import { ApiError, apiGet } from './client';

export interface OpenApiVersionCatalogEntry {
  id: string;
  version: string;
  display_name: string;
  is_default: boolean;
  supports_import: boolean;
  supports_export: boolean;
  supports_validation: boolean;
  supports_visual_editor: boolean;
  released_at: string | null;
  deprecated_at: string | null;
}

interface OpenApiVersionCatalogResponse {
  data?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeEntry(value: unknown): OpenApiVersionCatalogEntry | null {
  if (!isRecord(value)) return null;

  const {
    id,
    version,
    display_name: displayName,
    is_default: isDefault,
    supports_import: supportsImport,
    supports_export: supportsExport,
    supports_validation: supportsValidation,
    supports_visual_editor: supportsVisualEditor,
    released_at: releasedAt,
    deprecated_at: deprecatedAt,
  } = value;

  if (typeof id !== 'string' || typeof version !== 'string' || typeof displayName !== 'string') return null;
  if (
    typeof isDefault !== 'boolean'
    || typeof supportsImport !== 'boolean'
    || typeof supportsExport !== 'boolean'
    || typeof supportsValidation !== 'boolean'
    || typeof supportsVisualEditor !== 'boolean'
  ) {
    return null;
  }
  if (releasedAt !== null && typeof releasedAt !== 'string') return null;
  if (deprecatedAt !== null && typeof deprecatedAt !== 'string') return null;

  return {
    id,
    version,
    display_name: displayName,
    is_default: isDefault,
    supports_import: supportsImport,
    supports_export: supportsExport,
    supports_validation: supportsValidation,
    supports_visual_editor: supportsVisualEditor,
    released_at: releasedAt,
    deprecated_at: deprecatedAt,
  };
}

export async function listOpenApiVersions(): Promise<OpenApiVersionCatalogEntry[]> {
  const response = await apiGet<unknown>('/openapi-versions', { apiVersion: 'v1', authenticated: false });
  const source = isRecord(response) && Array.isArray((response as OpenApiVersionCatalogResponse).data)
    ? (response as OpenApiVersionCatalogResponse).data as unknown[]
    : [];
  const versions = source
    .map(normalizeEntry)
    .filter((entry): entry is OpenApiVersionCatalogEntry => entry !== null);

  if (source.length > 0 && versions.length === 0) {
    throw new ApiError('The openapi-versions endpoint returned an unsupported catalog format.');
  }

  return versions;
}
