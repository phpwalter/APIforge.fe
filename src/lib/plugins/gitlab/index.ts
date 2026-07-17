import { GitLabIcon } from '../../../components/Auth/ProviderIcons';
import type { Plugin } from '../types';

export const GITLAB_PLUGIN: Plugin = {
  id: 'gitlab',
  label: 'GitLab',
  icon: GitLabIcon,
  description: 'Connect your GitLab account via OAuth.',
  author: 'APIforge',
  version: 'Built-in',
  settingsPanel: () => import('./GitLabSettingsPanel').then((m) => ({ default: m.GitLabSettingsPanel })),
};
