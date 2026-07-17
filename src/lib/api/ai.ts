import { apiGet, apiPost } from './client';

/**
 * Backend-proxied per docs/ai-plugin-api-proposal.md — the frontend never holds a model provider
 * API key. This endpoint doesn't exist on the real backend yet; calls will fail (ApiError, likely
 * a 404) until it's implemented there. Built against the proposal so the frontend is ready to go
 * the moment it lands.
 */
export interface AiCompleteRequest {
  system?: string;
  prompt: string;
  max_tokens?: number;
}

export interface AiCompleteResponse {
  text: string;
}

export function aiComplete(request: AiCompleteRequest): Promise<AiCompleteResponse> {
  return apiPost<AiCompleteResponse>('/ai/complete', request);
}

export interface AiStatusResponse {
  available: boolean;
  model?: string;
}

export function fetchAiStatus(): Promise<AiStatusResponse> {
  return apiGet<AiStatusResponse>('/ai/status');
}
