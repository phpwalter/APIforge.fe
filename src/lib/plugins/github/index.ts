import { GitHubIcon } from '../../../components/Auth/ProviderIcons';
import type { Plugin } from '../types';

export const GITHUB_PLUGIN: Plugin = {
  id: 'github',
  label: 'GitHub',
  icon: GitHubIcon,
  description: 'Connect your GitHub account via OAuth to link it to your APIforge account.',
  author: 'APIforge',
  version: 'Built-in',
  settingsPanel: () => import('./GitHubSettingsPanel').then((m) => ({ default: m.GitHubSettingsPanel })),
};
