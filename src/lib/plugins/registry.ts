import type { FieldSlot, Plugin, PluginFieldAction, PluginToolbarAction } from './types';
import { AI_PLUGIN } from './ai';
import { GITHUB_PLUGIN } from './github';
import { GITLAB_PLUGIN } from './gitlab';
import { BITBUCKET_PLUGIN } from './bitbucket';

/**
 * First-party only — every plugin ships in this codebase and is statically imported here. No
 * dynamic loading, no sandboxing: that's a different (much bigger) problem for if/when APIforge
 * needs to run untrusted third-party plugin code.
 */
export const PLUGINS: Plugin[] = [AI_PLUGIN, GITHUB_PLUGIN, GITLAB_PLUGIN, BITBUCKET_PLUGIN];

export function getPlugin(id: string): Plugin | undefined {
  return PLUGINS.find((p) => p.id === id);
}

/** Field actions for a slot, from every enabled plugin — empty array renders no buttons. */
export function getFieldActions(slot: FieldSlot, enabledPluginIds: ReadonlySet<string>): PluginFieldAction[] {
  return PLUGINS.filter((p) => enabledPluginIds.has(p.id)).flatMap((p) => p.fieldActions?.[slot] ?? []);
}

export function getToolbarActions(enabledPluginIds: ReadonlySet<string>): PluginToolbarAction[] {
  return PLUGINS.filter((p) => enabledPluginIds.has(p.id)).flatMap((p) => p.toolbarActions ?? []);
}
