import { apiGet } from './client';

/** Raw row shape returned by GET /securityTypes — matches the DB table as-is. */
export interface SecurityTypeDto {
  id: string;
  security_scheme_type_id: string;
  slug: string;
  name: string;
  description: string;
  openapi_name: string;
  format: string | null;
  example: string | null;
  scheme: string | null;
  bearer_format: string | null;
  location: string | null;
  parameter_name: string | null;
  openid_connect_url: string | null;
  /** JSON-encoded OpenAPI `flows` object (oauth2 only), or null. */
  flows: string | null;
  is_active: boolean;
  /** JSON-encoded, currently unused by the UI. */
  metadata: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SecurityTypesResponse {
  data: SecurityTypeDto[];
}

export async function fetchSecurityTypes(): Promise<SecurityTypeDto[]> {
  const res = await apiGet<SecurityTypesResponse>('/securityTypes', { apiVersion: 'v1' });
  return res.data;
}

/** True for scheme types that take a Scopes field in the Security Schemes settings panel (oauth2 + OpenID Connect). */
export function securityTypeHasScopes(t: SecurityTypeDto): boolean {
  return Boolean(t.flows) || Boolean(t.openid_connect_url);
}

/**
 * Best-effort extraction of scope names from a `flows` JSON string, to
 * pre-fill the Scopes field. Returns '' (not an error) for anything
 * malformed or absent — this is just a starting point the user edits.
 */
export function scopesFromFlows(flowsJson: string | null): string {
  if (!flowsJson) return '';
  try {
    const flows = JSON.parse(flowsJson) as Record<string, { scopes?: Record<string, string> }>;
    const scopeNames = new Set<string>();
    Object.values(flows).forEach((flow) => {
      Object.keys(flow?.scopes ?? {}).forEach((name) => scopeNames.add(name));
    });
    return [...scopeNames].join(', ');
  } catch {
    return '';
  }
}
