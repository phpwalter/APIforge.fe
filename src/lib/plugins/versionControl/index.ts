import { Merge } from 'lucide-react';
import type { Plugin } from '../types';

export const VERSION_CONTROL_PLUGIN: Plugin = {
  id: 'versionControl',
  label: 'Version Control',
  icon: Merge,
  description: 'Connect GitHub, GitLab, or Bitbucket via OAuth to link your account.',
  author: 'APIforge',
  version: 'Built-in',
  settingsPanel: () => import('./VersionControlSettingsPanel').then((m) => ({ default: m.VersionControlSettingsPanel })),
};
