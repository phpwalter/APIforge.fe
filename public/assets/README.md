# Provider icon assets

The files here (`sso-badge-1.svg` … `sso-badge-6.svg`) are **placeholders**
— simple monogram badges in brand-adjacent colors, not the official
Google/GitHub/Apple/Atlassian/Confluence/Bitbucket logos.

They're served by Vite at `/assets/<name>.svg` (this whole folder maps
1:1 onto the site root). `src/components/Auth/providers.ts` maps each
provider `id` to its file — check that file for which badge is which.

## Why the filenames are generic, not `google.svg`/`github.svg`/etc.

Ad blockers and privacy extensions (uBlock Origin, Brave Shields, and
similar) ship filter-list rules that block requests to files named
after SSO providers — "sign in with X" buttons are a common tracking
vector, so filter lists match on exactly these kinds of filenames and
paths. When these files were named `google.svg`, `github.svg`, etc.,
the requests were silently blocked client-side before they ever hit
the network tab — no 404, no error, just nothing.

**Keep the filenames generic even when you swap in the real brand
assets** (or test in a browser with no ad blocker before assuming a
naming change broke something).

If a file is missing or fails to load for any other reason,
`ProviderIcon.tsx` falls back to an inline placeholder (from
`ProviderIcons.tsx`) instead of showing a broken-image icon.
