import type { ComponentType } from 'react';
import {
  Code,
  Pencil,
  Monitor,
  Info,
  Cable,
  Wrench,
  Keyboard,
  Download,
  Settings,
  Cookie,
  CircleHelp,
  Palette,
  SwatchBook,
  Binary,
  AlignLeft,
  Share2,
  Languages,
  RefreshCw,
  Wifi,
} from 'lucide-react';

export interface SettingsCategory {
  key: string;
  label: string;
  keywords: string;
  icon: ComponentType<{ size?: number | string }>;
  /** One level of nested items shown/expanded under this category in the settings rail. */
  children?: SettingsCategory[];
}

/**
 * Ordered as requested: "Account & Members" removed entirely, and
 * "Notes" moved to sit below "Export Defaults" (it was originally
 * between Code Preferences and Security Schemes in the source).
 * General, Servers & External Docs, and Security Schemes moved out to the
 * standalone Project Settings modal (Topbar :: More actions :: Project
 * Settings) — see src/components/Project/ProjectSettingsModal.tsx.
 * Every remaining category is a shell for now — selecting any of them just
 * shows "Coming Soon" until its real settings panel is built, except where a
 * dedicated panel is registered in SettingsModal.tsx.
 */
export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    key: 'preferences',
    label: 'Code Preferences',
    keywords: 'editor code preferences x-apiforge operationid tag mode resource naming response view codegen',
    icon: Code,
    children: [
      {
        key: 'colorScheme',
        label: 'Color Scheme',
        keywords: 'color scheme theme yaml json dark light high contrast auto monaco',
        icon: Palette,
      },
      {
        key: 'colorStyle',
        label: 'Color Style',
        keywords: 'color style syntax highlight yaml json keys strings numbers literals comments tokens',
        icon: SwatchBook,
      },
      {
        key: 'fileEncoding',
        label: 'File Encoding',
        keywords: 'file encoding charset utf-8 bom line ending crlf lf newline',
        icon: Binary,
      },
      { key: 'formatting', label: 'Formatting', keywords: 'formatting indent tabs spaces wrap', icon: AlignLeft },
      { key: 'shortcuts', label: 'Keyboard Shortcuts', keywords: 'undo redo keyboard shortcut', icon: Keyboard },
    ],
  },
  { key: 'appearance', label: 'Appearance', keywords: 'theme dark light system language', icon: Monitor },
  { key: 'notifications', label: 'Notifications', keywords: 'notifications alerts email', icon: Info },
  {
    key: 'plugins',
    label: 'Plugins',
    keywords:
      'plugins extensions marketplace ai assistant copilot generate version control git commit branch github gitlab bitbucket oauth connect link',
    icon: Cable,
  },
  { key: 'tools', label: 'Tools', keywords: 'tools external integrations', icon: Wrench },
  { key: 'export', label: 'Export Defaults', keywords: 'export clean full filename yaml download', icon: Download },
  { key: 'notes', label: 'Notes', keywords: 'notes todo internal decisions x-apiforge', icon: Pencil },
  { key: 'other', label: 'Advanced Settings', keywords: 'misc other advanced', icon: Settings },
  {
    key: 'system',
    label: 'System Settings',
    keywords: 'system data sharing language region updates backup sync',
    icon: Monitor,
    children: [
      { key: 'dataSharing', label: 'Data Sharing', keywords: 'data sharing privacy telemetry analytics', icon: Share2 },
      { key: 'languageRegion', label: 'Language & Region', keywords: 'language region locale timezone', icon: Languages },
      { key: 'updates', label: 'Updates', keywords: 'updates version release changelog', icon: RefreshCw },
      { key: 'backupSync', label: 'Backup & Sync', keywords: 'sync cloud backup devices', icon: Wifi },
    ],
  },
  { key: 'cookies', label: 'Cookies', keywords: 'cookies privacy analytics marketing consent', icon: Cookie },
  { key: 'about', label: 'About…', keywords: 'about version credits apiforge', icon: CircleHelp },
];