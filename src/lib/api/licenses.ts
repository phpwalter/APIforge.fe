import { ApiError, apiGet } from './client';

export interface LicenseCatalogEntry {
  id: string;
  name: string;
  spdx_id: string;
  url: string;
}

interface LicenseCatalogResponse {
  data?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeEntry(value: unknown): LicenseCatalogEntry | null {
  if (!isRecord(value)) return null;
  const { id, name, spdx_id: spdxId, url } = value;
  if (![id, name, spdxId, url].every((field) => typeof field === 'string')) return null;

  return {
    id: id as string,
    name: name as string,
    spdx_id: spdxId as string,
    url: url as string,
  };
}

export async function listLicenses(): Promise<LicenseCatalogEntry[]> {
  const response = await apiGet<unknown>('/licenses', { apiVersion: 'v1', authenticated: false });
  const source = isRecord(response) && Array.isArray((response as LicenseCatalogResponse).data)
    ? (response as LicenseCatalogResponse).data as unknown[]
    : [];
  const licenses = source.map(normalizeEntry).filter((entry): entry is LicenseCatalogEntry => entry !== null);

  if (source.length > 0 && licenses.length === 0) {
    throw new ApiError('The licenses endpoint returned an unsupported license catalog format.');
  }

  return licenses.sort((left, right) => left.name.localeCompare(right.name));
}
