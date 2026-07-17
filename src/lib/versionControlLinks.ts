/**
 * All three providers Settings :: Version Control lists — only 'github' has a real backend OAuth
 * link/unlink round trip today (see auth.ts); 'gitlab' and 'bitbucket' never actually get stored
 * here since their UI is a disabled stub, but the type stays open to them for when they land.
 */
export type VersionControlProvider = 'github' | 'gitlab' | 'bitbucket';

export interface VersionControlLinkInfo {
  username?: string;
  avatarUrl?: string;
}

export type VersionControlLinks = Partial<Record<VersionControlProvider, VersionControlLinkInfo>>;

const STORAGE_KEY = 'apiforge_version_control_links';

export function getVersionControlLinks(): VersionControlLinks {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as VersionControlLinks;
  } catch {
    return {};
  }
}

export function setVersionControlLinks(links: VersionControlLinks): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}
