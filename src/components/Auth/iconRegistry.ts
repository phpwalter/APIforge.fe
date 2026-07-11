import type { IconComponent } from './ProviderIcons';
import { GoogleIcon, AtlassianIcon, GitHubIcon, ConfluenceIcon, AppleIcon, BitbucketIcon } from './ProviderIcons';

/** Keyed by AuthProvider.id — used as the <img onError> fallback in ProviderIcon.tsx. */
export const FALLBACK_ICONS: Record<string, IconComponent> = {
  google: GoogleIcon,
  atlassian: AtlassianIcon,
  github: GitHubIcon,
  confluence: ConfluenceIcon,
  apple: AppleIcon,
  bitbucket: BitbucketIcon,
};
