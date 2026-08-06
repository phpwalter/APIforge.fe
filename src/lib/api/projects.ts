import { apiGet } from './client';

export type ServerProjectStatus = 'active' | 'draft' | 'archived' | string;

export interface ServerProjectSummary {
  id: string;
  name: string;
  status?: ServerProjectStatus;
  updatedAt: string;
}

export interface ServerProjectDocument extends ServerProjectSummary {
  specJson: string;
}

export function listServerProjects(): Promise<ServerProjectSummary[]> {
  return apiGet<ServerProjectSummary[]>('/projects', { apiVersion: 'v1' });
}

export function getServerProject(id: string): Promise<ServerProjectDocument> {
  return apiGet<ServerProjectDocument>(`/projects/${id}`, { apiVersion: 'v1' });
}
