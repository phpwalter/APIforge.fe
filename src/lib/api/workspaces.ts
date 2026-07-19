import { apiGet } from './client';

/**
 * Wrappers for the GET /workspaces endpoints proposed in
 * docs/workspace-server-storage-api-proposal.md — none of these exist on the real backend yet, so
 * calls will fail (ApiError, likely a 404) until it's implemented there. Built against the
 * proposal so the frontend is ready to go, same pattern as src/lib/api/repos.ts.
 */
export interface ServerWorkspaceSummary {
  id: string;
  name: string;
  updatedAt: string;
}

export interface ServerWorkspaceDocument extends ServerWorkspaceSummary {
  specJson: string;
}

export function listServerWorkspaces(): Promise<ServerWorkspaceSummary[]> {
  return apiGet<ServerWorkspaceSummary[]>('/workspaces');
}

export function getServerWorkspace(id: string): Promise<ServerWorkspaceDocument> {
  return apiGet<ServerWorkspaceDocument>(`/workspaces/${id}`);
}
