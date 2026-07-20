/**
 * Persisted "recent projects" — each entry holds the full OpenAPI document as JSON, generated
 * by the same buildOpenApiDocument()/documentToJson() pipeline REST Projection's export already
 * uses, and reopened through the same parseOpenApiDocument()/importSpec() pipeline Import already
 * uses. No bespoke save format — a saved project is just an OpenAPI document plus a name.
 */
export interface ProjectEntry {
  id: string;
  name: string;
  savedAt: number;
  specJson: string;
}

export type ProjectSummary = Omit<ProjectEntry, 'specJson'>;

const STORAGE_KEY = 'apiforge_recent_projects';
/** Pre-rename key ("Workspace" → "Project") — read once as a fallback so existing users' saved
 * entries aren't silently orphaned by the key change, then migrated onto STORAGE_KEY. */
const LEGACY_STORAGE_KEY = 'apiforge_recent_workspaces';
/** Hard cap — a FIFO list of at most this many entries; the oldest drops off once a new one
 * pushes it out. Nothing beyond this many is ever stored. */
const MAX_PROJECTS = 5;

function readAll(): ProjectEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as ProjectEntry[]) : [];
    } catch {
      return [];
    }
  }

  const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacyRaw) return [];
  try {
    const parsed = JSON.parse(legacyRaw) as unknown;
    const legacyEntries = Array.isArray(parsed) ? (parsed as ProjectEntry[]) : [];
    // The legacy list may have been saved under a higher cap — enforce MAX_PROJECTS here too,
    // keeping only the most-recently-saved entries.
    const entries = [...legacyEntries].sort((a, b) => b.savedAt - a.savedAt).slice(0, MAX_PROJECTS);
    writeAll(entries);
    return entries;
  } catch {
    return [];
  }
}

function writeAll(entries: ProjectEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** Metadata only (no specJson) — cheap enough to call on every Recent Projects menu open. */
export function listProjects(): ProjectSummary[] {
  return readAll()
    .map(({ id, name, savedAt }) => ({ id, name, savedAt }))
    .sort((a, b) => b.savedAt - a.savedAt);
}

export function getProject(id: string): ProjectEntry | undefined {
  return readAll().find((w) => w.id === id);
}

/** Creates or updates a project entry — most-recently-saved first, capped at MAX_PROJECTS. */
export function saveProject(entry: ProjectEntry): void {
  const next = readAll().filter((w) => w.id !== entry.id);
  next.unshift(entry);
  writeAll(next.slice(0, MAX_PROJECTS));
}

export function deleteProject(id: string): void {
  writeAll(readAll().filter((w) => w.id !== id));
}

export function generateProjectId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `proj_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/** Shared by Recent Projects and the Load Project dialog's project list. */
export function formatRelativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
