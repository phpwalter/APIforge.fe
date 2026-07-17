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
  /** Rendered as this plugin's own row in Settings :: Plugins when present. */
  settingsPanel?: ComponentType;
}
