import { apiGet } from './client';
import { listOpenApiVersions } from './openApiVersions';

vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof import('./client')>('./client');
  return {
    ...actual,
    apiGet: vi.fn(),
  };
});

const mockedApiGet = vi.mocked(apiGet);

describe('listOpenApiVersions', () => {
  it('loads the public governed catalog without re-sorting backend order', async () => {
    mockedApiGet.mockResolvedValue({
      data: [
        {
          id: 'oas-320',
          version: '3.2.0',
          display_name: 'OpenAPI 3.2.0',
          is_default: false,
          supports_import: true,
          supports_export: true,
          supports_validation: true,
          supports_visual_editor: true,
          released_at: null,
          deprecated_at: null,
        },
        {
          id: 'oas-310',
          version: '3.1.0',
          display_name: 'OpenAPI 3.1.0',
          is_default: true,
          supports_import: true,
          supports_export: true,
          supports_validation: true,
          supports_visual_editor: true,
          released_at: null,
          deprecated_at: null,
        },
      ],
      meta: { count: 2 },
    });

    const entries = await listOpenApiVersions();

    expect(mockedApiGet).toHaveBeenCalledWith('/openapi-versions', {
      apiVersion: 'v1',
      authenticated: false,
    });
    expect(entries.map((entry) => entry.version)).toEqual(['3.2.0', '3.1.0']);
  });

  it('rejects a non-empty catalog whose entries do not match the contract', async () => {
    mockedApiGet.mockResolvedValue({ data: [{ version: '3.2.0' }] });

    await expect(listOpenApiVersions()).rejects.toThrow(
      'The openapi-versions endpoint returned an unsupported catalog format.',
    );
  });
});
