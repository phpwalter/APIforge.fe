import { apiPost } from './client';

export interface CompanyRecord {
  id: string;
  name: string;
  legal_name?: string | null;
  slug: string;
  website_url?: string | null;
  description?: string | null;
  role_code: string;
}

export interface CreateCompanyRequest {
  name: string;
  legal_name?: string;
  slug?: string;
  website_url?: string;
  description?: string;
  contact_email?: string;
  country?: string;
  timezone?: string;
}

export async function createCompany(payload: CreateCompanyRequest): Promise<CompanyRecord> {
  const response = await apiPost<{ data: { company: CompanyRecord } }>('/companies', { apiVersion: 'v1' }, payload);
  return response.data.company;
}

export async function assignCompanyMember(companyId: string, email: string, roleCode: string): Promise<void> {
  await apiPost(`/companies/${encodeURIComponent(companyId)}/members`, { apiVersion: 'v1' }, {
    email,
    role_code: roleCode,
  });
}
