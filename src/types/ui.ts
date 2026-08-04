/** Resolved visual theme. Scoped to dark/light per the handoff README. */
export type ThemeName = 'dark' | 'light';

/** User-facing theme preference — 'system' follows the OS setting. */
export type ThemeMode = 'system' | ThemeName;

export type SaveState = 'saved' | 'saving' | 'unsaved';

export type CanvasTabId = 'design' | 'schema' | 'rest' | 'swagger' | 'diagnostics';

/** Output format shown/edited in the REST Projection tab. */
export type RestProjectionFormat = 'yaml' | 'json';

export interface CanvasTabDef {
  id: CanvasTabId;
  label: string;
}

export interface UserProfile {
  username?: string;
  name: string;
  email: string;
  /** Absent for the demo sign-in providers, which have no real backend to source a photo from. */
  avatarUrl?: string;
  /** The rest are only ever populated from a real backend session — absent for demo sign-in. */
  bio?: string;
  /** Raw backend timestamp strings (created_at / last_login_at) — formatted for display where shown. */
  memberSince?: string;
  lastLoginAt?: string;
  useGravatar?: boolean;
  gravatarEmail?: string;
  /** Optimistic-concurrency version returned by POST/PATCH /auth/me. */
  recordVersion?: number;
  /** Effective platform roles returned by the authenticated profile endpoint. */
  roles?: string[];
  companyId?: string;
  companyName?: string;
  companySlug?: string;
  planCode?: string;
}

/**
 * Editor-behavior preferences saved alongside the spec under the
 * `x-apiforge.preferences` vendor extension — shapes editor defaults and
 * codegen suggestions. Stripped automatically from Clean OpenAPI exports.
 */
export interface ApiforgePreferences {
  operationIdStyle: 'lowerCamelCase' | 'snake_case' | 'kebab-case';
  tagMode: 'operation' | 'resource';
  resourceNamingStyle: 'singularResource' | 'pluralResource';
  defaultResponseView: 'structured' | 'raw';
}

/**
 * Local, in-browser notification preferences. APIforge has no backend/email —
 * these only control what's shown while working in this browser.
 */
export interface NotificationPreferences {
  importExportStatus: boolean;
  diagnosticsAlerts: boolean;
  autosaveConfirmations: boolean;
}