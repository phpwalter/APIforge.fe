import type { ComponentType } from 'react';

/**
 * Every text field a plugin can attach an inline action to. Adding a new slot means wrapping that
 * field in <FieldActionSlot slot="..."> — see MethodEditor.tsx, RequestPanel.tsx, ResponsePanel.tsx,
 * and SchemaScalarEditor.tsx for the four that exist today.
 */
export type FieldSlot = 'operationSummary' | 'requestBodyDescription' | 'responseDescription' | 'schemaDescription';

export interface FieldActionContext {
  slot: FieldSlot;
  /** The field's current text — most actions use this as the thing to improve/replace. */
  value: string;
  /** Free-form context a prompt-builder can draw on (e.g. { method: 'GET', path: '/users/{id}' }). */
  hints: Record<string, string>;
}

export interface PluginFieldAction {
  id: string;
  icon: ComponentType<{ size?: number }>;
  /** Shown as a tooltip on the inline button. */
  label: string;
  /** Returns the field's new value. Throwing surfaces as an inline error, not a crash. */
  run: (context: FieldActionContext) => Promise<string>;
}

export interface PluginToolbarAction {
  id: string;
  icon: ComponentType<{ size?: number }>;
  label: string;
  run: () => void;
}

export interface Plugin {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  description: string;
  /** Shown in Settings :: Plugins — first-party plugins are all "APIforge" for now. */
  author: string;
  version: string;
  /** Registered per slot — a slot with no entry here just renders no button. */
  fieldActions?: Partial<Record<FieldSlot, PluginFieldAction[]>>;
  toolbarActions?: PluginToolbarAction[];
  /**
   * Lazily loaded and rendered in Settings :: Plugins' detail pane when present — a dynamic
   * import() rather than a direct component reference, same pattern as ColorStylePreview's lazy
   * load. This isn't just a bundle-size nicety: a plugin's settings panel may use the app store
   * (e.g. Version Control's does), and the registry is itself imported by the store (for default
   * enabled-plugin state) — a direct static import here would form useAppStore -> registry ->
   * this plugin -> its panel -> useAppStore, a circular import that breaks at module-eval time.
   */
  settingsPanel?: () => Promise<{ default: ComponentType }>;
}
