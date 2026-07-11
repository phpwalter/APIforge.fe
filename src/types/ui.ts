/** Resolved visual theme. Scoped to dark/light per the handoff README. */
export type ThemeName = 'dark' | 'light';

/** User-facing theme preference — 'system' follows the OS setting. */
export type ThemeMode = 'system' | ThemeName;

export type SaveState = 'saved' | 'saving' | 'unsaved';

export type CanvasTabId = 'design' | 'schema' | 'rest' | 'swagger' | 'diagnostics';

export interface CanvasTabDef {
  id: CanvasTabId;
  label: string;
}

export interface UserProfile {
  name: string;
  email: string;
}
