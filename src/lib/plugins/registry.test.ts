import { getFieldActions, getPlugin, getToolbarActions, PLUGINS } from './registry';

describe('plugin registry', () => {
  it('registers the AI plugin', () => {
    expect(getPlugin('ai')).toBeDefined();
    expect(getPlugin('ai')?.label).toBe('AI');
  });

  it('registers the Version Control plugin, with a settings panel but no field actions', () => {
    const plugin = getPlugin('versionControl');
    expect(plugin).toBeDefined();
    expect(plugin?.label).toBe('Version Control');
    expect(plugin?.settingsPanel).toBeDefined();
    expect(plugin?.fieldActions).toBeUndefined();
  });

  it('returns undefined for an unknown plugin id', () => {
    expect(getPlugin('nonexistent')).toBeUndefined();
  });

  it('getFieldActions returns the AI plugin\'s action for a registered slot when enabled', () => {
    const actions = getFieldActions('operationSummary', new Set(['ai']));
    expect(actions).toHaveLength(1);
    expect(actions[0].id).toBe('ai-generate');
  });

  it('getFieldActions returns nothing when the plugin is disabled', () => {
    expect(getFieldActions('operationSummary', new Set())).toEqual([]);
  });

  it('getFieldActions returns nothing for a slot no plugin has registered anything for', () => {
    // AI covers all four real slots; Version Control registers none — exercise the "no actions
    // for this plugin+slot combination" path directly against the registry data.
    const aiPlugin = PLUGINS.find((p) => p.id === 'ai')!;
    expect(Object.keys(aiPlugin.fieldActions ?? {}).sort()).toEqual(
      ['operationSummary', 'requestBodyDescription', 'responseDescription', 'schemaDescription'].sort(),
    );
    const versionControlPlugin = PLUGINS.find((p) => p.id === 'versionControl')!;
    expect(versionControlPlugin.fieldActions).toBeUndefined();
  });

  it('getToolbarActions returns an empty array — no plugin registers toolbar actions yet', () => {
    expect(getToolbarActions(new Set(PLUGINS.map((p) => p.id)))).toEqual([]);
  });
});
