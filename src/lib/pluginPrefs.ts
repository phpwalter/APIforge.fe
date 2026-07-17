import { PLUGINS } from './plugins/registry';

const STORAGE_KEY = 'apiforge_enabled_plugins';

/** Every registered plugin is on by default — nothing stored yet means "use the defaults". */
function defaultEnabledIds(): string[] {
  return PLUGINS.map((p) => p.id);
}

export function getEnabledPluginIds(): Set<string> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return new Set(defaultEnabledIds());
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? new Set(parsed.filter((id): id is string => typeof id === 'string')) : new Set(defaultEnabledIds());
  } catch {
    return new Set(defaultEnabledIds());
  }
}

export function setEnabledPluginIds(ids: ReadonlySet<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}
