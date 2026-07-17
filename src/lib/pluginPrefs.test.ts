import { getEnabledPluginIds, setEnabledPluginIds } from './pluginPrefs';
import { PLUGINS } from './plugins/registry';

beforeEach(() => {
  localStorage.clear();
});

describe('pluginPrefs', () => {
  it('defaults to every registered plugin enabled when nothing is stored', () => {
    expect(getEnabledPluginIds()).toEqual(new Set(PLUGINS.map((p) => p.id)));
  });

  it('stores and retrieves a changed set', () => {
    setEnabledPluginIds(new Set());
    expect(getEnabledPluginIds()).toEqual(new Set());
  });

  it('falls back to the default when stored JSON is malformed', () => {
    localStorage.setItem('apiforge_enabled_plugins', 'not json');
    expect(getEnabledPluginIds()).toEqual(new Set(PLUGINS.map((p) => p.id)));
  });

  it('falls back to the default when stored JSON is not an array', () => {
    localStorage.setItem('apiforge_enabled_plugins', JSON.stringify({ ai: true }));
    expect(getEnabledPluginIds()).toEqual(new Set(PLUGINS.map((p) => p.id)));
  });
});
