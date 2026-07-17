import { create } from 'zustand';
import type {
  ApiforgePreferences,
  CanvasTabId,
  NotificationPreferences,
  RestProjectionFormat,
  SaveState,
  ThemeMode,
  ThemeName,
  UserProfile,
} from '../types/ui';
import type { ApiContact, ApiExternalDocs, ApiLicense } from '../types/spec';
import { signOutProvider, unlinkProvider } from '../lib/api/auth';
import { clearAuthToken } from '../lib/api/authToken';
import { getCookiePrefs, setCookiePrefs, type CookiePrefs } from '../lib/cookiePrefs';
import {
  getVersionControlLinks,
  setVersionControlLinks,
  type VersionControlLinkInfo,
  type VersionControlLinks,
  type VersionControlProvider,
} from '../lib/versionControlLinks';
import { getEnabledPluginIds, setEnabledPluginIds } from '../lib/pluginPrefs';
import type { CharacterEncoding, LineEnding } from '../lib/fileEncoding';
import { MONACO_THEME_IDS, type ColorScheme, type MonacoThemeId } from '../lib/colorScheme';
import {
  DEFAULT_COLOR_STYLE_CUSTOM_COLORS,
  DEFAULT_COLOR_STYLE_PREFS,
  type ColorStyleCategory,
  type ColorStyleCustomColors,
  type ColorStyleItem,
  type ColorStylePrefs,
} from '../lib/colorStyle';

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : true;
}

function resolveTheme(mode: ThemeMode): ThemeName {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return mode;
}

interface AppState {
  // Theme
  themeMode: ThemeMode;
  theme: ThemeName;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;

  // Project identity (topbar "project settings" pill)
  apiTitle: string;
  apiVersion: string;
  apiOpenapiVersion: string;
  setProjectInfo: (info: { title: string; version: string; openapiVersion: string }) => void;
  setApiOpenapiVersion: (version: string) => void;

  // Settings :: General — the rest of the OpenAPI `info` object.
  apiDescription: string;
  apiTermsOfService: string;
  apiContact: ApiContact;
  apiLicense: ApiLicense;
  setApiField: (field: 'title' | 'version' | 'description' | 'termsOfService', value: string) => void;
  setApiContactField: (field: keyof ApiContact, value: string) => void;
  setApiLicenseField: (field: keyof ApiLicense, value: string) => void;

  // Settings :: Servers & External Docs
  apiServers: string[];
  apiExternalDocs: ApiExternalDocs;
  addApiServer: () => void;
  removeApiServer: (index: number) => void;
  setApiServerUrl: (index: number, url: string) => void;
  setApiExternalDocsField: (field: keyof ApiExternalDocs, value: string) => void;

  // Settings :: Code Preferences (x-apiforge.preferences)
  apiforgePreferences: ApiforgePreferences;
  setApiforgePreference: <K extends keyof ApiforgePreferences>(key: K, value: ApiforgePreferences[K]) => void;

  // Settings :: Notifications
  notificationPreferences: NotificationPreferences;
  setNotificationPreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ) => void;

  // Save status badge
  saveState: SaveState;
  lastSavedAt: number | null;

  // Undo / redo — real history wiring comes with the spec-editing panels.
  // The stacks are modeled now so the topbar controls have real disabled state.
  undoStack: unknown[];
  redoStack: unknown[];
  undo: () => void;
  redo: () => void;

  // Topbar menus
  moreMenuOpen: boolean;
  toggleMoreMenu: () => void;
  closeMoreMenu: () => void;

  userMenuOpen: boolean;
  toggleUserMenu: () => void;
  closeUserMenu: () => void;

  // Account
  signedIn: boolean;
  userProfile: UserProfile;
  /** Which provider the current session is authenticated against, if any real (non-demo) one. */
  authProvider: string | null;
  /** Instant demo sign-in for providers without a real backend integration yet. */
  signIn: () => void;
  /** Populates a real session after the backend's OAuth round trip resolves via GET /auth/me. */
  hydrateSession: (profile: UserProfile, provider: string) => void;
  signOut: () => void;

  // Settings :: Version Control — GitHub links via a real OAuth round trip (see auth.ts /
  // App.tsx); GitLab and Bitbucket are UI-only stubs since the backend has no callback for them.
  versionControlLinks: VersionControlLinks;
  connectVersionControlProvider: (provider: VersionControlProvider, info: VersionControlLinkInfo) => void;
  disconnectVersionControlProvider: (provider: VersionControlProvider) => void;

  // Settings :: Plugins — which registered plugins (src/lib/plugins/registry.ts) are active.
  enabledPluginIds: Set<string>;
  togglePlugin: (id: string) => void;

  // Auth modal (provider-only — no username/password)
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;

  // Canvas tab
  canvasTab: CanvasTabId;
  setCanvasTab: (id: CanvasTabId) => void;

  // Diagnostics summary — placeholder until api-policy.js compliance
  // checking (the Diagnostics panel) is ported.
  compliancePct: number;
  errorCount: number;
  warnCount: number;

  // Modals (stubs — wired up as each modal panel is built)
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  // Export OpenAPI document modal
  exportOpen: boolean;
  openExportModal: () => void;
  closeExportModal: () => void;

  // Generic markdown-doc review dialog (footer/About links: Terms, Privacy, Security, etc.)
  docDialogOpen: boolean;
  docDialogTitle: string;
  docDialogSrc: string;
  openDocDialog: (title: string, src: string) => void;
  closeDocDialog: () => void;

  // Cookie category preferences (Settings > Cookies). Persisted to localStorage.
  cookiePrefs: CookiePrefs;
  setCookiePref: (key: keyof CookiePrefs, value: boolean) => void;

  // REST Projection tab: active format, x-apiforge visibility, and any in-progress hand edits
  // (null means "show the live-generated doc" — see restProjectionEdit.ts for the commit flow).
  restProjectionFormat: RestProjectionFormat;
  setRestProjectionFormat: (format: RestProjectionFormat) => void;
  restProjectionShowMeta: boolean;
  toggleRestProjectionMeta: () => void;
  // Syntax highlighting and line numbers are per-format — toggling one off for YAML doesn't affect JSON.
  restProjectionHighlighting: Record<RestProjectionFormat, boolean>;
  setRestProjectionHighlighting: (format: RestProjectionFormat, v: boolean) => void;
  restProjectionLineNumbers: Record<RestProjectionFormat, boolean>;
  setRestProjectionLineNumbers: (format: RestProjectionFormat, v: boolean) => void;
  restProjectionManual: Record<RestProjectionFormat, string | null>;
  setRestProjectionManual: (format: RestProjectionFormat, text: string) => void;
  restProjectionError: string | null;
  setRestProjectionError: (message: string | null) => void;
  clearRestProjectionManual: () => void;

  // Settings :: Code Preferences :: File Encoding — applies to both REST Projection's "Copy to
  // clipboard" and the Export dialog's downloads, regardless of YAML/JSON format.
  fileEncodingCharacterEncoding: CharacterEncoding;
  setFileEncodingCharacterEncoding: (v: CharacterEncoding) => void;
  fileEncodingLineEnding: LineEnding;
  setFileEncodingLineEnding: (v: LineEnding) => void;
  fileEncodingInsertFinalNewline: boolean;
  setFileEncodingInsertFinalNewline: (v: boolean) => void;

  // Settings :: Code Preferences :: Formatting — also not per-format. Indent Style: Tabs only
  // applies where valid (JSON, and Monaco's own typing) — YAML forbids tab indentation, so it
  // always uses spaces regardless of this setting (see resolveIndentUnit in restProjectionCanvas usage).
  formattingIndentSize: 2 | 4;
  setFormattingIndentSize: (v: 2 | 4) => void;
  formattingIndentStyle: 'spaces' | 'tabs';
  setFormattingIndentStyle: (v: 'spaces' | 'tabs') => void;
  formattingWordWrap: boolean;
  setFormattingWordWrap: (v: boolean) => void;
  // Whitespace cleanup applied at copy/export time only (never to the live editable text).
  formattingTrimTrailingWhitespace: boolean;
  setFormattingTrimTrailingWhitespace: (v: boolean) => void;
  formattingRemoveBlankLines: boolean;
  setFormattingRemoveBlankLines: (v: boolean) => void;

  // Settings :: Code Preferences :: Color Scheme — the REST Projection editor's own Monaco
  // theme, independent of (but defaulting to follow) the app's Day/Night theme.
  editorColorScheme: ColorScheme;
  setEditorColorScheme: (v: ColorScheme) => void;

  // Settings :: Code Preferences :: Color Style — per-token-type color toggles, layered on top
  // of whichever Color Scheme is active. Applies to YAML and JSON alike.
  colorStyle: ColorStylePrefs;
  setColorStyleCategory: (category: ColorStyleCategory, v: boolean) => void;
  // Custom colors are kept separately per base Monaco theme (see ColorStyleCustomColors) — a
  // color tuned for Dark shouldn't silently apply to Light too. `color: null` resets to default.
  colorStyleCustomColors: ColorStyleCustomColors;
  setColorStyleCustomColor: (theme: MonacoThemeId, item: ColorStyleItem, color: string | null) => void;
  /** Writes (or clears) a color identically across every base theme — backs the "All Color Schemes" option. */
  setColorStyleCustomColorAll: (item: ColorStyleItem, color: string | null) => void;
  /** Restores every Color Style toggle to on, and clears every custom color for the given theme ('all' clears every theme). */
  resetColorStyle: (theme: MonacoThemeId | 'all') => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  themeMode: 'dark',
  theme: resolveTheme('dark'),
  toggleTheme: () => {
    // Mirrors the prototype's cycle: dark -> system -> light -> dark
    const { themeMode } = get();
    const next: ThemeMode = themeMode === 'dark' ? 'system' : themeMode === 'system' ? 'light' : 'dark';
    set({ themeMode: next, theme: resolveTheme(next) });
  },
  setThemeMode: (mode) => set({ themeMode: mode, theme: resolveTheme(mode) }),

  apiTitle: 'Untitled API',
  apiVersion: '1.0.0',
  apiOpenapiVersion: '3.1.0',
  setProjectInfo: ({ title, version, openapiVersion }) =>
    set({ apiTitle: title, apiVersion: version, apiOpenapiVersion: openapiVersion }),
  setApiOpenapiVersion: (version) => set({ apiOpenapiVersion: version }),

  apiDescription: '',
  apiTermsOfService: '',
  apiContact: { name: '', email: '', url: '' },
  apiLicense: { name: '', url: '' },
  setApiField: (field, value) => {
    switch (field) {
      case 'title':
        return set({ apiTitle: value });
      case 'version':
        return set({ apiVersion: value });
      case 'description':
        return set({ apiDescription: value });
      case 'termsOfService':
        return set({ apiTermsOfService: value });
    }
  },
  setApiContactField: (field, value) => set((s) => ({ apiContact: { ...s.apiContact, [field]: value } })),
  setApiLicenseField: (field, value) => set((s) => ({ apiLicense: { ...s.apiLicense, [field]: value } })),

  apiServers: [],
  apiExternalDocs: { description: '', url: '' },
  addApiServer: () => set((s) => ({ apiServers: [...s.apiServers, ''] })),
  removeApiServer: (index) => set((s) => ({ apiServers: s.apiServers.filter((_, i) => i !== index) })),
  setApiServerUrl: (index, url) =>
    set((s) => ({ apiServers: s.apiServers.map((u, i) => (i === index ? url : u)) })),
  setApiExternalDocsField: (field, value) =>
    set((s) => ({ apiExternalDocs: { ...s.apiExternalDocs, [field]: value } })),

  apiforgePreferences: {
    operationIdStyle: 'lowerCamelCase',
    tagMode: 'operation',
    resourceNamingStyle: 'singularResource',
    defaultResponseView: 'structured',
  },
  setApiforgePreference: (key, value) =>
    set((s) => ({ apiforgePreferences: { ...s.apiforgePreferences, [key]: value } })),

  notificationPreferences: {
    importExportStatus: true,
    diagnosticsAlerts: true,
    autosaveConfirmations: false,
  },
  setNotificationPreference: (key, value) =>
    set((s) => ({ notificationPreferences: { ...s.notificationPreferences, [key]: value } })),

  saveState: 'saved',
  lastSavedAt: Date.now(),

  undoStack: [],
  redoStack: [],
  undo: () => {},
  redo: () => {},

  moreMenuOpen: false,
  toggleMoreMenu: () => set((s) => ({ moreMenuOpen: !s.moreMenuOpen, userMenuOpen: false })),
  closeMoreMenu: () => set({ moreMenuOpen: false }),

  userMenuOpen: false,
  toggleUserMenu: () => set((s) => ({ userMenuOpen: !s.userMenuOpen, moreMenuOpen: false })),
  closeUserMenu: () => set({ userMenuOpen: false }),

  signedIn: false,
  userProfile: { name: '', email: '' },
  authProvider: null,
  signIn: () =>
    set({
      signedIn: true,
      userProfile: { name: 'James Taylor', email: 'james@acme-corp.com' },
      userMenuOpen: false,
      authOpen: false,
      authProvider: null,
    }),
  hydrateSession: (profile, provider) =>
    set({ signedIn: true, userProfile: profile, authProvider: provider, userMenuOpen: false, authOpen: false }),
  signOut: () => {
    const { authProvider } = get();
    if (authProvider) {
      signOutProvider(authProvider).catch(() => {});
      clearAuthToken();
    }
    set({ signedIn: false, userProfile: { name: '', email: '' }, authProvider: null, userMenuOpen: false });
  },

  versionControlLinks: getVersionControlLinks(),
  connectVersionControlProvider: (provider, info) =>
    set((s) => {
      const next = { ...s.versionControlLinks, [provider]: info };
      setVersionControlLinks(next);
      return { versionControlLinks: next };
    }),
  disconnectVersionControlProvider: (provider) => {
    unlinkProvider(provider).catch(() => {});
    set((s) => {
      const next = { ...s.versionControlLinks };
      delete next[provider];
      setVersionControlLinks(next);
      return { versionControlLinks: next };
    });
  },

  enabledPluginIds: getEnabledPluginIds(),
  togglePlugin: (id) =>
    set((s) => {
      const next = new Set(s.enabledPluginIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setEnabledPluginIds(next);
      return { enabledPluginIds: next };
    }),

  authOpen: false,
  openAuth: () => set({ authOpen: true, moreMenuOpen: false, userMenuOpen: false }),
  closeAuth: () => set({ authOpen: false }),

  canvasTab: 'design',
  setCanvasTab: (id) => set({ canvasTab: id }),

  compliancePct: 100,
  errorCount: 0,
  warnCount: 0,

  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true, moreMenuOpen: false }),
  closeSettings: () => set({ settingsOpen: false }),

  exportOpen: false,
  openExportModal: () => set({ exportOpen: true, moreMenuOpen: false }),
  closeExportModal: () => set({ exportOpen: false }),

  docDialogOpen: false,
  docDialogTitle: '',
  docDialogSrc: '',
  openDocDialog: (title, src) => set({ docDialogOpen: true, docDialogTitle: title, docDialogSrc: src }),
  closeDocDialog: () => set({ docDialogOpen: false }),

  cookiePrefs: getCookiePrefs(),
  setCookiePref: (key, value) =>
    set((s) => {
      const next = { ...s.cookiePrefs, [key]: value };
      setCookiePrefs(next);
      return { cookiePrefs: next };
    }),

  restProjectionFormat: 'yaml',
  setRestProjectionFormat: (format) => set({ restProjectionFormat: format }),
  restProjectionShowMeta: false,
  toggleRestProjectionMeta: () => set((s) => ({ restProjectionShowMeta: !s.restProjectionShowMeta })),
  restProjectionHighlighting: { yaml: true, json: true },
  setRestProjectionHighlighting: (format, v) =>
    set((s) => ({ restProjectionHighlighting: { ...s.restProjectionHighlighting, [format]: v } })),
  restProjectionLineNumbers: { yaml: true, json: true },
  setRestProjectionLineNumbers: (format, v) =>
    set((s) => ({ restProjectionLineNumbers: { ...s.restProjectionLineNumbers, [format]: v } })),
  restProjectionManual: { yaml: null, json: null },
  setRestProjectionManual: (format, text) =>
    set((s) => ({ restProjectionManual: { ...s.restProjectionManual, [format]: text } })),
  restProjectionError: null,
  setRestProjectionError: (message) => set({ restProjectionError: message }),
  clearRestProjectionManual: () =>
    set({ restProjectionManual: { yaml: null, json: null }, restProjectionError: null }),

  fileEncodingCharacterEncoding: 'utf-8',
  setFileEncodingCharacterEncoding: (v) => set({ fileEncodingCharacterEncoding: v }),
  fileEncodingLineEnding: 'lf',
  setFileEncodingLineEnding: (v) => set({ fileEncodingLineEnding: v }),
  fileEncodingInsertFinalNewline: true,
  setFileEncodingInsertFinalNewline: (v) => set({ fileEncodingInsertFinalNewline: v }),

  formattingIndentSize: 2,
  setFormattingIndentSize: (v) => set({ formattingIndentSize: v }),
  formattingIndentStyle: 'spaces',
  setFormattingIndentStyle: (v) => set({ formattingIndentStyle: v }),
  formattingWordWrap: false,
  setFormattingWordWrap: (v) => set({ formattingWordWrap: v }),
  formattingTrimTrailingWhitespace: true,
  setFormattingTrimTrailingWhitespace: (v) => set({ formattingTrimTrailingWhitespace: v }),
  formattingRemoveBlankLines: true,
  setFormattingRemoveBlankLines: (v) => set({ formattingRemoveBlankLines: v }),

  editorColorScheme: 'auto',
  setEditorColorScheme: (v) => set({ editorColorScheme: v }),

  colorStyle: DEFAULT_COLOR_STYLE_PREFS,
  setColorStyleCategory: (category, v) => set((s) => ({ colorStyle: { ...s.colorStyle, [category]: v } })),

  colorStyleCustomColors: DEFAULT_COLOR_STYLE_CUSTOM_COLORS,
  setColorStyleCustomColor: (theme, item, color) =>
    set((s) => {
      const forTheme = { ...s.colorStyleCustomColors[theme] };
      if (color == null) delete forTheme[item];
      else forTheme[item] = color;
      return { colorStyleCustomColors: { ...s.colorStyleCustomColors, [theme]: forTheme } };
    }),
  setColorStyleCustomColorAll: (item, color) =>
    set((s) => {
      const next = { ...s.colorStyleCustomColors };
      for (const theme of MONACO_THEME_IDS) {
        const forTheme = { ...next[theme] };
        if (color == null) delete forTheme[item];
        else forTheme[item] = color;
        next[theme] = forTheme;
      }
      return { colorStyleCustomColors: next };
    }),
  resetColorStyle: (theme) =>
    set((s) => ({
      colorStyle: DEFAULT_COLOR_STYLE_PREFS,
      colorStyleCustomColors:
        theme === 'all'
          ? Object.fromEntries(MONACO_THEME_IDS.map((t) => [t, {}])) as typeof s.colorStyleCustomColors
          : { ...s.colorStyleCustomColors, [theme]: {} },
    })),
}));

/** userInitials derivation, matching the source: first letters of up to 2 words. */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
