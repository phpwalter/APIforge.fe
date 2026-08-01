import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Endpoint } from '../types/spec';

const fetchResponseHeaderPolicy = vi.fn();

vi.mock('../lib/api/apiHeaders', () => ({
  fetchResponseHeaderPolicy,
}));

import { useSpecStore } from './useSpecStore';

const initialState = useSpecStore.getState();

function endpointWithResponse(code = '200'): Endpoint {
  return {
    id: 'ep_headers',
    path: '/widgets',
    method: 'GET',
    summary: '',
    operationId: '',
    tags: [],
    security: [],
    params: [],
    headers: [],
    requestBodyEnabled: false,
    requestBodyDescription: '',
    responses: [
      {
        id: 'res_headers',
        code,
        description: 'OK',
        headers: [],
        contentTypes: ['application/json'],
        schema: '',
        schemaIsArray: false,
      },
    ],
  };
}

beforeEach(() => {
  useSpecStore.setState(initialState, true);
  useSpecStore.setState({ hasDocument: true, endpoints: [endpointWithResponse()] });
  fetchResponseHeaderPolicy.mockReset();
});

describe('response header policies', () => {
  it('prepopulates required headers and default-enabled conditional headers', async () => {
    fetchResponseHeaderPolicy.mockResolvedValue({
      data: [
        {
          status_code: 200,
          header_code: 'x_api_version',
          header_name: 'X-API-Version',
          display_name: 'API Version',
          description: 'Selected API engine version.',
          policy_code: 'required',
          policy_name: 'Required',
          condition_code: null,
          condition_name: null,
          rationale: 'Required on every APIForge response.',
          default_enabled: true,
          value_schema: {},
          example_value: 'v1',
          default_value_template: 'v1',
          display_order: 10,
        },
        {
          status_code: 200,
          header_code: 'etag',
          header_name: 'ETag',
          display_name: 'ETag',
          description: 'Entity tag.',
          policy_code: 'conditional',
          policy_name: 'Conditional',
          condition_code: 'when_validator_available',
          condition_name: 'When validator available',
          rationale: 'Add when a validator is available.',
          default_enabled: true,
          value_schema: {},
          example_value: '"abc"',
          default_value_template: null,
          display_order: 20,
        },
      ],
      meta: { count: 2, status_code: 200 },
    });

    await useSpecStore.getState().applyResponseHeaderPolicy('ep_headers', 'res_headers', 200);

    const response = useSpecStore.getState().endpoints[0].responses[0];
    expect(response.headers.map((header) => header.name)).toEqual(['X-API-Version', 'ETag']);
    expect(response.headers[0]).toMatchObject({ required: true, mandated: true, example: 'v1' });
    expect(response.headerPolicyStatusCode).toBe(200);
  });

  it('removes forbidden headers and preserves valid user headers when the code changes', async () => {
    useSpecStore.setState({
      endpoints: [
        {
          ...endpointWithResponse(),
          responses: [
            {
              ...endpointWithResponse().responses[0],
              headers: [
                { id: 'content', name: 'Content-Type', required: false, nullable: false, example: 'application/json' },
                { id: 'custom', name: 'X-Custom', required: false, nullable: false, example: 'keep' },
              ],
            },
          ],
        },
      ],
    });

    fetchResponseHeaderPolicy.mockResolvedValue({
      data: [
        {
          status_code: 204,
          header_code: 'x_api_version',
          header_name: 'X-API-Version',
          display_name: 'API Version',
          description: '',
          policy_code: 'required',
          policy_name: 'Required',
          condition_code: null,
          condition_name: null,
          rationale: 'Required.',
          default_enabled: true,
          value_schema: {},
          example_value: 'v1',
          default_value_template: 'v1',
          display_order: 10,
        },
        {
          status_code: 204,
          header_code: 'content_type',
          header_name: 'Content-Type',
          display_name: 'Content Type',
          description: '',
          policy_code: 'forbidden',
          policy_name: 'Forbidden',
          condition_code: null,
          condition_name: null,
          rationale: '204 has no representation body.',
          default_enabled: false,
          value_schema: {},
          example_value: null,
          default_value_template: null,
          display_order: 20,
        },
      ],
      meta: { count: 2, status_code: 204 },
    });

    await useSpecStore.getState().setResponseCodeWithHeaderPolicy('ep_headers', 'res_headers', '204');

    const response = useSpecStore.getState().endpoints[0].responses[0];
    expect(response.code).toBe('204');
    expect(response.headers.map((header) => header.name)).toEqual(['X-Custom', 'X-API-Version']);
  });

  it('does not allow a mandated header to be renamed or removed', async () => {
    useSpecStore.setState({
      endpoints: [
        {
          ...endpointWithResponse(),
          responses: [
            {
              ...endpointWithResponse().responses[0],
              headers: [
                {
                  id: 'version',
                  name: 'X-API-Version',
                  required: true,
                  mandated: true,
                  nullable: false,
                  example: 'v1',
                },
              ],
            },
          ],
        },
      ],
    });

    useSpecStore.getState().setResponseHeader('ep_headers', 'res_headers', 'version', {
      name: 'X-Other',
      required: false,
    });
    useSpecStore.getState().removeResponseHeader('ep_headers', 'res_headers', 'version');

    const header = useSpecStore.getState().endpoints[0].responses[0].headers[0];
    expect(header).toMatchObject({ name: 'X-API-Version', required: true, mandated: true });
  });
});
