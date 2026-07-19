import { apiGet } from './client';

/**
 * Wrappers for the GET /projects endpoints proposed in
 * docs/project-server-storage-api-proposal.md — none of these exist on the real backend yet, so
 * calls will fail (ApiError, likely a 404) until it's implemented there. Built against the
 * proposal so the frontend is ready to go, same pattern as src/lib/api/repos.ts.
 */
export interface ServerProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
}

export interface ServerProjectDocument extends ServerProjectSummary {
  specJson: string;
}

export function listServerProjects(): Promise<ServerProjectSummary[]> {
  return apiGet<ServerProjectSummary[]>('/projects');
}

export function getServerProject(id: string): Promise<ServerProjectDocument> {
  return apiGet<ServerProjectDocument>(`/projects/${id}`);
}
