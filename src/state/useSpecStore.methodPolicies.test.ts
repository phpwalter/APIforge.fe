import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSpecStore } from './useSpecStore';
import { fetchResolvedMethodPolicy } from '../lib/api/methodPolicies';

vi.mock('../lib/api/methodPolicies', () => ({
  fetchResolvedMethodPolicy: vi.fn(),
}));

const mockedFetch = vi.mocked(fetchResolvedMethodPolicy);

describe('method policy application', () => {
  beforeEach(() => {
    useSpecStore.getState().importSpec({ endpoints: [], schemas: [] });
    mockedFetch.mockReset();
  });

  it('creates a path without automatically adding GET', () => {
    useSpecStore.getState().addEndpoint();
    expect(useSpecStore.getState().endpoints).toHaveLength(0);
    expect(useSpecStore.getState().endpointDrafts).toHaveLength(1);
  });

  it('creates configured responses when a method is added', async () => {
    mockedFetch.mockResolvedValue({
      data: [
        { http_method: 'POST', status_code: 201, title: 'Created', description: '', response_class: 2, is_enabled: true, is_required: true, is_default: true, display_order: 10, effective_source: 'system', project_overrides_allowed: false, project_plan_eligible: false },
        { http_method: 'POST', status_code: 422, title: 'Unprocessable Content', description: '', response_class: 4, is_enabled: true, is_required: true, is_default: false, display_order: 20, effective_source: 'system', project_overrides_allowed: false, project_plan_eligible: false },
      ],
      meta: { count: 2, http_method: 'POST', company_id: null, project_id: null, plan_code: null },
    });

    useSpecStore.getState().addEndpoint();
    const path = useSpecStore.getState().endpointDrafts[0].path;
    await useSpecStore.getState().pickMethod(path, 'POST');

    expect(useSpecStore.getState().endpointDrafts).toHaveLength(0);
    expect(useSpecStore.getState().endpoints[0].method).toBe('POST');
    expect(useSpecStore.getState().endpoints[0].responses.map((response) => response.code)).toEqual(['201', '422']);
  });
});
