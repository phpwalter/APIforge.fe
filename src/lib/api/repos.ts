import { apiGet } from './client';

/**
 * Wrappers for the GET /repos/github/* endpoints proposed in
 * docs/version-control-api-proposal.md — none of these exist on the real backend yet, so calls
 * will fail (ApiError, likely a 404) until it's implemented there. Built against the proposal so
 * the frontend is ready to go the moment it lands, same pattern as src/lib/api/ai.ts.
 */
export interface GithubRepo {
  id: number;
  full_name: string;
  private: boolean;
  default_branch: string;
  html_url: string;
}

export interface GithubBranch {
  name: string;
  protected: boolean;
}

export interface GithubContentEntry {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
}

export interface GithubFileContent {
  name: string;
  path: string;
  sha: string;
  content: string;
  encoding: string;
}

export function listGithubRepos(): Promise<GithubRepo[]> {
  return apiGet<GithubRepo[]>('/repos/github', { apiVersion: 'v1' });
}

export function listGithubBranches(owner: string, repo: string): Promise<GithubBranch[]> {
  return apiGet<GithubBranch[]>(`/repos/github/${owner}/${repo}/branches`, { apiVersion: 'v1' });
}

/** Directory listing when path is a folder, or a single file's content when path is a file. */
export function getGithubContents(
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<GithubContentEntry[] | GithubFileContent> {
  const query = new URLSearchParams({ path, ref }).toString();
  return apiGet<GithubContentEntry[] | GithubFileContent>(`/repos/github/${owner}/${repo}/contents?${query}`, { apiVersion: 'v1' });
}
