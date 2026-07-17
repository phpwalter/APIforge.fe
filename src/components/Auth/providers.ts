export interface AuthProvider {
  id: string;
  label: string;
  /** Path into /public — served at this exact URL by Vite. */
  icon: string;
}

/**
 * This app authenticates via OAuth-style providers only — there is no
 * username/password flow. Order matches the 2-column grid in the modal
 * (left column, right column, left, right, …).
 *
 * Icon files live in /public/assets and are placeholders (monogram
 * badges, not the official logos) — see public/assets/README.md.
 *
 * Filenames are intentionally generic (sso-badge-N.svg, not
 * "google.svg" etc.) — ad blockers and privacy extensions (uBlock
 * Origin, Brave Shields, …) ship filter-list rules that block requests
 * to files named after SSO providers, since "sign in with X" buttons
 * are a common tracking vector. That silently killed these requests
 * before they even hit the network tab. Keep the filenames generic
 * even when you swap in the real brand assets.
 */
export const PROVIDERS: AuthProvider[] = [
  { id: 'google', label: 'Google', icon: '/assets/sso-badge-1.svg' },
  { id: 'atlassian', label: 'Atlassian', icon: '/assets/sso-badge-2.svg' },
  { id: 'github', label: 'GitHub', icon: '/assets/sso-badge-3.svg' },
  { id: 'confluence', label: 'Confluence', icon: '/assets/sso-badge-4.svg' },
  { id: 'apple', label: 'Apple', icon: '/assets/sso-badge-5.svg' },
  { id: 'bitbucket', label: 'Bitbucket', icon: '/assets/sso-badge-6.svg' },
];

/** "google" -> "Google", falling back to the raw id for a provider not in the known list. */
export function providerLabel(providerId: string): string {
  return PROVIDERS.find((p) => p.id === providerId)?.label ?? providerId;
}
