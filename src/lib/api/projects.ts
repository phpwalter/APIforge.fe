import { ApiError, apiGet } from './client';

export interface ServerProjectSummary {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
}

export interface ServerProjectDocument extends ServerProjectSummary {
  specJson: string;
}

type ProjectListEnvelope = {
  data?: unknown;
  projects?: unknown;
  items?: unknown;
};

type ProjectRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ProjectRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readString(record: ProjectRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }

  return undefined;
}

function normalizeProject(value: unknown): ServerProjectSummary | null {
  if (!isRecord(value)) return null;

  const id = readString(value, 'id', 'projectId', 'project_id');
  const name = readString(value, 'name', 'projectName', 'project_name', 'title');
  const updatedAt = readString(value, 'updatedAt', 'updated_at', 'modifiedAt', 'modified_at');

  if (!id || !name || !updatedAt) return null;

  return {
    id,
    name,
    status: readString(value, 'status', 'projectStatus', 'project_status') ?? 'Active',
    updatedAt,
  };
}

function projectArrayFromResponse(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];

  const envelope = response as ProjectListEnvelope;
  if (Array.isArray(envelope.data)) return envelope.data;
  if (Array.isArray(envelope.projects)) return envelope.projects;
  if (Array.isArray(envelope.items)) return envelope.items;

  if (isRecord(envelope.data)) {
    if (Array.isArray(envelope.data.projects)) return envelope.data.projects;
    if (Array.isArray(envelope.data.items)) return envelope.data.items;
  }

  return [];
}

export async function listServerProjects(): Promise<ServerProjectSummary[]> {
  const response = await apiGet<unknown>('/projects', { apiVersion: 'v1' });
  const source = projectArrayFromResponse(response);
  const projects = source.map(normalizeProject).filter((project): project is ServerProjectSummary => project !== null);

  if (source.length > 0 && projects.length === 0) {
    throw new ApiError('The projects endpoint returned an unsupported project-list format.');
  }

  return projects;
}

export async function getServerProject(id: string): Promise<ServerProjectDocument> {
  const response = await apiGet<unknown>(`/projects/${encodeURIComponent(id)}`, { apiVersion: 'v1' });
  const value = isRecord(response) && isRecord(response.data) ? response.data : response;

  if (!isRecord(value)) {
    throw new ApiError('The project endpoint returned an unsupported project format.');
  }

  const summary = normalizeProject(value);
  const specJson = readString(value, 'specJson', 'spec_json', 'document', 'specification');

  if (!summary || specJson === undefined) {
    throw new ApiError('The project endpoint returned an incomplete project document.');
  }

  return { ...summary, specJson };
}
