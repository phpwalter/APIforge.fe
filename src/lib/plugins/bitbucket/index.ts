import { BitbucketIcon } from '../../../components/Auth/ProviderIcons';
import type { Plugin } from '../types';

export const BITBUCKET_PLUGIN: Plugin = {
  id: 'bitbucket',
  label: 'Bitbucket',
  icon: BitbucketIcon,
  description: 'Connect your Bitbucket account via OAuth.',
  author: 'APIforge',
  version: 'Built-in',
  settingsPanel: () => import('./BitbucketSettingsPanel').then((m) => ({ default: m.BitbucketSettingsPanel })),
};
