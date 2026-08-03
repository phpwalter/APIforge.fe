import type { HttpMethod } from '../../types/spec';
import { apiGet, apiPatch } from './client';

export type MethodPolicyScope = 'system' | 'company' | 'project';

export interface ResolvedMethodPolicyItem {
  http_method: HttpMethod;
  status_code: number;
  title: string;
  description: string;
  response_class: number;
  is_enabled: boolean;
  is_required: boolean;
  is_default: boolean;
  display_order: number;
  effective_source: MethodPolicyScope;
  project_overrides_allowed: boolean;
  project_plan_eligible: boolean;
}

export interface ResolvedMethodPolicyResponse {
  data: ResolvedMethodPolicyItem[];
  meta: {
    count: number;
    http_method: HttpMethod;
    company_id: string | null;
    project_id: string | null;
    plan_code: string | null;
  };
}

export interface MethodPolicyContext {
  companyId?: string | null;
  projectId?: string | null;
  planCode?: string | null;
}

export function fetchResolvedMethodPolicy(
  method: HttpMethod,
  context: MethodPolicyContext = {},
): Promise<ResolvedMethodPolicyResponse> {
  const query = new URLSearchParams();
  if (context.companyId) query.set('companyId', context.companyId);
  if (context.projectId) query.set('projectId', context.projectId);
  if (context.planCode) query.set('planCode', context.planCode);
  const suffix = query.toString();
  return apiGet<ResolvedMethodPolicyResponse>(
    `/method-settings/${method}/resolved${suffix ? `?${suffix}` : ''}`,
    { apiVersion: 'v1', authenticated: false },
  );
}

export interface MethodPolicyOverrideChanges {
  is_enabled?: boolean;
  is_required?: boolean;
  is_default?: boolean;
  display_order?: number;
}

export function saveMethodPolicyOverride(
  scope: MethodPolicyScope,
  method: HttpMethod,
  statusCode: number,
  body: {
    actor_user_id: string;
    company_id?: string | null;
    project_id?: string | null;
    changes: MethodPolicyOverrideChanges;
  },
): Promise<{ data: Record<string, unknown> }> {
  return apiPatch(`/method-settings/${scope}/${method}/${statusCode}`, { apiVersion: 'v1' }, body);
}

export interface CompanyMethodPolicyControls {
  allow_project_method_overrides: boolean;
  allow_project_response_additions: boolean;
  allow_project_response_disabling: boolean;
  allow_project_required_changes: boolean;
  allow_project_default_changes: boolean;
  allow_project_reordering: boolean;
}

export function saveCompanyMethodPolicyControls(body: {
  actor_user_id: string;
  company_id: string;
  changes: Partial<CompanyMethodPolicyControls>;
}): Promise<{ data: CompanyMethodPolicyControls }> {
  return apiPatch('/method-settings/company-controls', { apiVersion: 'v1' }, body);
}
