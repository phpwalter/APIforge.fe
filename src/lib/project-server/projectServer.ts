import { apiGet, apiPatch, apiPost } from '../api/client';
import { parseOpenApiDocument } from '../openapiImport';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';

const API_VERSION = 'v1';
const SERVER_STATE_PREFIX = 'apiforge.project-server.v2:';
const LEGACY_SERVER_STATE_PREFIX = 'apiforge.project-server.v1:';

interface Envelope<T> {
  data: T;
}

export interface ServerProject {
  id: string;
  account_id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: 'active' | 'archived' | 'deleted';
  visibility: 'private' | 'public';
  updated_at: string;
}

export interface ServerDocument {
  id: string;
  project_id: string;
  name: string;
  document: Record<string, unknown>;
  created_at?: string;
  updated_at: string;
  deleted_at?: string | null;
}

interface ProjectServerState {
  projectId: string;
  documentId: string | null;
  documentUpdatedAt: string | null;
  projectName: string | null;
}

function storageKey(accountKey: string): string {
  return `${SERVER_STATE_PREFIX}${accountKey}`;
}

function legacyStorageKey(accountKey: string): string {
  return `${LEGACY_SERVER_STATE_PREFIX}${accountKey}`;
}

function readState(accountKey: string): ProjectServerState | null {
  const raw = sessionStorage.getItem(storageKey(accountKey))
    ?? sessionStorage.getItem(legacyStorageKey(accountKey));
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Partial<ProjectServerState>;
    if (typeof value.projectId !== 'string' || value.projectId.trim() === '') return null;

    const migrated: ProjectServerState = {
      projectId: value.projectId,
      documentId: typeof value.documentId === 'string' ? value.documentId : null,
      documentUpdatedAt: typeof value.documentUpdatedAt === 'string' ? value.documentUpdatedAt : null,
      projectName: typeof value.projectName === 'string' ? value.projectName : null,
    };

    writeState(accountKey, migrated);
    sessionStorage.removeItem(legacyStorageKey(accountKey));
    return migrated;
  } catch {
    return null;
  }
}

function writeState(accountKey: string, value: ProjectServerState): void {
  sessionStorage.setItem(storageKey(accountKey), JSON.stringify(value));
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `project-${Date.now()}`;
}

export function canonicalDocumentName(projectName: string): string {
  return projectName.trim() || 'Untitled Project';
}

function timestamp(value?: string): number {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

/**
 * Resolves the single document that the current project-oriented UI treats as authoritative.
 * Existing state wins, followed by an exact project-name match, then the oldest document.
 * This keeps older projects deterministic without exposing a document picker.
 */
export function selectPrimaryDocument(
  documents: ServerDocument[],
  projectName: string,
  preferredDocumentId: string | null,
): ServerDocument | undefined {
  const active = documents.filter((document) => document.deleted_at == null);
  if (active.length === 0) return undefined;

  if (preferredDocumentId) {
    const preferred = active.find((document) => document.id === preferredDocumentId);
    if (preferred) return preferred;
  }

  const canonicalName = canonicalDocumentName(projectName).toLocaleLowerCase();
  const named = active.filter(
    (document) => document.name.trim().toLocaleLowerCase() === canonicalName,
  );
  const candidates = named.length > 0 ? named : active;

  return [...candidates].sort((left, right) => {
    const byCreated = timestamp(left.created_at) - timestamp(right.created_at);
    return byCreated !== 0 ? byCreated : left.id.localeCompare(right.id);
  })[0];
}

async function synchronizeProjectName(
  project: ServerProject,
  projectName: string,
): Promise<ServerProject> {
  const canonicalName = canonicalDocumentName(projectName);
  if (project.name === canonicalName) return project;

  const updated = await apiPatch<Envelope<ServerProject>>(
    `/projects/${encodeURIComponent(project.id)}`,
    { apiVersion: API_VERSION },
    { name: canonicalName, slug: slugify(canonicalName) },
  );
  return updated.data;
}

export async function ensureServerProject(
  accountKey: string,
  accountId: string,
  name: string,
): Promise<ProjectServerState> {
  const canonicalName = canonicalDocumentName(name);
  const existing = readState(accountKey);

  if (existing) {
    const result = await apiGet<Envelope<ServerProject>>(
      `/projects/${encodeURIComponent(existing.projectId)}`,
      { apiVersion: API_VERSION },
    );
    const synchronized = await synchronizeProjectName(result.data, canonicalName);
    const state = { ...existing, projectName: synchronized.name };
    writeState(accountKey, state);
    return state;
  }

  const created = await apiPost<Envelope<ServerProject>>(
    '/projects',
    { apiVersion: API_VERSION },
    { account_id: accountId, name: canonicalName, slug: slugify(canonicalName) },
  );

  const state: ProjectServerState = {
    projectId: created.data.id,
    documentId: null,
    documentUpdatedAt: null,
    projectName: created.data.name,
  };
  writeState(accountKey, state);
  useAppStore.getState().openExistingProject(created.data.id, created.data.name);
  return state;
}

async function resolvePrimaryDocument(
  state: ProjectServerState,
  projectName: string,
): Promise<ServerDocument | undefined> {
  const listed = await apiGet<Envelope<ServerDocument[]>>(
    `/projects/${encodeURIComponent(state.projectId)}/documents`,
    { apiVersion: API_VERSION },
  );

  const primary = selectPrimaryDocument(listed.data, projectName, state.documentId);
  if (listed.data.filter((document) => document.deleted_at == null).length > 1) {
    console.warn(
      `APIForge project ${state.projectId} has multiple documents. `
      + `Using ${primary?.id ?? 'none'} as the canonical working document.`,
    );
  }
  return primary;
}

export async function saveServerDocument(
  accountKey: string,
  accountId: string,
  projectName: string,
  document: Record<string, unknown>,
): Promise<ServerDocument> {
  const canonicalName = canonicalDocumentName(projectName);
  const state = await ensureServerProject(accountKey, accountId, canonicalName);
  const primary = await resolvePrimaryDocument(state, canonicalName);

  let saved: ServerDocument;
  if (!primary) {
    const created = await apiPost<Envelope<ServerDocument>>(
      `/projects/${encodeURIComponent(state.projectId)}/documents`,
      { apiVersion: API_VERSION },
      { name: canonicalName, document },
    );
    saved = created.data;
  } else {
    const current = await apiGet<Envelope<ServerDocument>>(
      `/documents/${encodeURIComponent(primary.id)}`,
      { apiVersion: API_VERSION },
    );

    if (
      state.documentId === current.data.id
      && state.documentUpdatedAt
      && current.data.updated_at !== state.documentUpdatedAt
    ) {
      throw new Error(
        'The server project changed since it was loaded. Reload before saving to avoid overwriting newer work.',
      );
    }

    const updated = await apiPatch<Envelope<ServerDocument>>(
      `/documents/${encodeURIComponent(current.data.id)}`,
      { apiVersion: API_VERSION },
      { name: canonicalName, document },
    );
    saved = updated.data;
  }

  writeState(accountKey, {
    projectId: state.projectId,
    documentId: saved.id,
    documentUpdatedAt: saved.updated_at,
    projectName: canonicalName,
  });
  return saved;
}

export async function restoreServerProject(accountKey: string): Promise<boolean> {
  const state = readState(accountKey);
  if (!state) return false;

  const projectResult = await apiGet<Envelope<ServerProject>>(
    `/projects/${encodeURIComponent(state.projectId)}`,
    { apiVersion: API_VERSION },
  );
  const project = projectResult.data;
  const document = await resolvePrimaryDocument(state, project.name);
  if (!document) return false;

  const parsed = parseOpenApiDocument(
    JSON.stringify(document.document),
    `${project.name}.json`,
  );
  useSpecStore.getState().importSpec(parsed);
  useAppStore.getState().openExistingProject(project.id, project.name);
  writeState(accountKey, {
    projectId: project.id,
    documentId: document.id,
    documentUpdatedAt: document.updated_at,
    projectName: project.name,
  });
  return true;
}

export function clearServerProjectState(accountKey: string): void {
  sessionStorage.removeItem(storageKey(accountKey));
  sessionStorage.removeItem(legacyStorageKey(accountKey));
}
