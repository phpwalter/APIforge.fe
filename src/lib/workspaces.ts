/**
 * Persisted "recent workspaces" — each entry holds the full OpenAPI document as JSON, generated
 * by the same buildOpenApiDocument()/documentToJson() pipeline REST Projection's export already
 * uses, and reopened through the same parseOpenApiDocument()/importSpec() pipeline Import already
 * uses. No bespoke save format — a saved workspace is just an OpenAPI document plus a name.
 */
export interface WorkspaceEntry {
  id: string;
  name: string;
  savedAt: number;
  specJson: string;
}

export type WorkspaceSummary = Omit<WorkspaceEntry, 'specJson'>;

const STORAGE_KEY = 'apiforge_recent_workspaces';
/** Keeps localStorage usage bounded — oldest entries drop off once this many are saved. */
const MAX_WORKSPACES = 10;

function readAll(): WorkspaceEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as WorkspaceEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: WorkspaceEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** Metadata only (no specJson) — cheap enough to call on every Recent Workspaces menu open. */
export function listWorkspaces(): WorkspaceSummary[] {
  return readAll()
    .map(({ id, name, savedAt }) => ({ id, name, savedAt }))
    .sort((a, b) => b.savedAt - a.savedAt);
}

export function getWorkspace(id: string): WorkspaceEntry | undefined {
  return readAll().find((w) => w.id === id);
}

/** Creates or updates a workspace entry — most-recently-saved first, capped at MAX_WORKSPACES. */
export function saveWorkspace(entry: WorkspaceEntry): void {
  const next = readAll().filter((w) => w.id !== entry.id);
  next.unshift(entry);
  writeAll(next.slice(0, MAX_WORKSPACES));
}

export function deleteWorkspace(id: string): void {
  writeAll(readAll().filter((w) => w.id !== id));
}

export function generateWorkspaceId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `ws_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
