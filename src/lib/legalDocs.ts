/**
 * Maps each footer/About link label to the markdown file it opens in the review dialog.
 * Keyed by the exact button label used in LandingPage.tsx and AboutSettingsPanel.tsx — a label
 * with no entry here (e.g. "Status", "Docs") just stays an inert button.
 */
export const LEGAL_DOCS: Record<string, { title: string; src: string }> = {
  Terms: { title: 'Terms', src: '/docs/terms.md' },
  Privacy: { title: 'Privacy', src: '/docs/privacy.md' },
  Security: { title: 'Security', src: '/docs/security.md' },
  Community: { title: 'Community', src: '/docs/community.md' },
  Contact: { title: 'Contact', src: '/docs/contact.md' },
  Cookies: { title: 'Cookies', src: '/docs/cookies.md' },
  'Do not share my personal information': {
    title: 'Do Not Share My Personal Information',
    src: '/docs/ppi.md',
  },
};
