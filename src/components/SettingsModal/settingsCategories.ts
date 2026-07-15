import type { ComponentType } from 'react';
import {
  Layers,
  Route,
  Code,
  Pencil,
  Key,
  Monitor,
  Info,
  Link,
  Merge,
  SlidersHorizontal,
  Sparkles,
  Globe,
  Keyboard,
  Download,
  Settings,
  Cookie,
  CircleHelp,
} from 'lucide-react';

export interface SettingsCategory {
  key: string;
  label: string;
  keywords: string;
  icon: ComponentType<{ size?: number }>;
}

/**
 * Ordered as requested: "Account & Members" removed entirely, and
 * "Notes" moved to sit below "Export Defaults" (it was originally
 * between Editor Preferences and Security Schemes in the source).
 * Every category is a shell for now — selecting any of them just shows
 * "Coming Soon" until its real settings panel is built.
 */
export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  { key: 'general', label: 'General', keywords: 'title version description contact license terms project info', icon: Layers },
  { key: 'servers', label: 'Servers & External Docs', keywords: 'servers url external docs', icon: Route },
  {
    key: 'preferences',
    label: 'Editor Preferences',
    keywords: 'x-apiforge operationid tag mode resource naming response view codegen',
    icon: Code,
  },
  { key: 'security', label: 'Security Schemes', keywords: 'auth apikey bearer oauth security scheme', icon: Key },
  { key: 'appearance', label: 'Appearance', keywords: 'theme dark light system language', icon: Monitor },
  { key: 'notifications', label: 'Notifications', keywords: 'notifications alerts email', icon: Info },
  { key: 'plugins', label: 'Plugins', keywords: 'plugins extensions marketplace', icon: Link },
  { key: 'versionControl', label: 'Version Control', keywords: 'version control git commit branch', icon: Merge },
  { key: 'tools', label: 'Tools', keywords: 'tools external integrations', icon: SlidersHorizontal },
  { key: 'ai', label: 'AI', keywords: 'ai assistant copilot generate', icon: Sparkles },
  { key: 'sync', label: 'Sync', keywords: 'sync cloud backup devices', icon: Globe },
  { key: 'shortcuts', label: 'Keyboard Shortcuts', keywords: 'undo redo keyboard shortcut', icon: Keyboard },
  { key: 'export', label: 'Export Defaults', keywords: 'export clean full filename yaml download', icon: Download },
  { key: 'notes', label: 'Notes', keywords: 'notes todo internal decisions x-apiforge', icon: Pencil },
  { key: 'other', label: 'Other Settings', keywords: 'misc other advanced', icon: Settings },
  { key: 'cookies', label: 'Cookies', keywords: 'cookies privacy analytics marketing consent', icon: Cookie },
  { key: 'about', label: 'About…', keywords: 'about version credits apiforge', icon: CircleHelp },
];
