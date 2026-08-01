import { apiGet } from './client';

export type ApiHeaderPolicyCode = 'required' | 'conditional' | 'optional' | 'forbidden' | string;

export interface ApiHeaderCatalogItem {
  header_id: string;
  header_code: string;
  header_name: string;
  header_display_name: string;
  header_description: string;
  header_type_code: string;
  header_type_name: string;
  direction: 'request' | 'response' | 'both' | string;
  value_schema: Record<string, unknown>;
  example_value: string | null;
  default_value_template: string | null;
  status_code: number | null;
  policy_code: ApiHeaderPolicyCode | null;
  policy_name: string | null;
  condition_code: string | null;
  condition_name: string | null;
  rationale: string | null;
  default_enabled: boolean | null;
  display_order: number;
}

export interface ApiResponseHeaderPolicyItem {
  status_code: number;
  header_code: string;
  header_name: string;
  display_name: string;
  description: string;
  policy_code: ApiHeaderPolicyCode;
  policy_name: string;
  condition_code: string | null;
  condition_name: string | null;
  rationale: string;
  default_enabled: boolean;
  value_schema: Record<string, unknown>;
  example_value: string | null;
  default_value_template: string | null;
  display_order: number;
}

export interface ApiHeaderCatalogResponse {
  data: ApiHeaderCatalogItem[];
  meta: {
    count: number;
    status_code: number | null;
    include_inactive: boolean;
  };
}

export interface ApiResponseHeaderPolicyResponse {
  data: ApiResponseHeaderPolicyItem[];
  meta: {
    count: number;
    status_code: number;
  };
}

export interface FetchApiHeadersOptions {
  statusCode?: number;
  includeInactive?: boolean;
}

export async function fetchApiHeaders(
  options: FetchApiHeadersOptions = {},
): Promise<ApiHeaderCatalogResponse> {
  const params = new URLSearchParams();
  if (options.statusCode !== undefined) params.set('statusCode', String(options.statusCode));
  if (options.includeInactive !== undefined) params.set('includeInactive', String(options.includeInactive));
  const query = params.toString();

  return apiGet<ApiHeaderCatalogResponse>(`/headers${query ? `?${query}` : ''}`, {
    apiVersion: 'v1',
  });
}

export function fetchResponseHeaderPolicy(statusCode: number): Promise<ApiResponseHeaderPolicyResponse> {
  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    return Promise.reject(new RangeError('statusCode must be an integer from 100 through 599.'));
  }

  return apiGet<ApiResponseHeaderPolicyResponse>(`/headers/policies/${statusCode}`, {
    apiVersion: 'v1',
  });
}
