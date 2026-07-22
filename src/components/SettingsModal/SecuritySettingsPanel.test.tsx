import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecuritySettingsPanel } from './SecuritySettingsPanel';
import { useSpecStore } from '../../state/useSpecStore';
import { fetchSecurityTypes } from '../../lib/api/securityTypes';
import type { SecurityTypeDto } from '../../lib/api/securityTypes';
import type { ProjectSettingsDraft } from '../Project/projectSettingsDraft';

vi.mock('../../lib/api/securityTypes', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api/securityTypes')>('../../lib/api/securityTypes');
  return {
    ...actual,
    fetchSecurityTypes: vi.fn(),
  };
});

function makeType(overrides: Partial<SecurityTypeDto> = {}): SecurityTypeDto {
  return {
    id: 'bearer-id',
    security_scheme_type_id: 'http',
    slug: 'bearer',
    name: 'Bearer Token',
    description: 'HTTP bearer authentication.',
    openapi_name: 'bearerAuth',
    format: null,
    example: null,
    scheme: 'bearer',
    bearer_format: null,
    location: null,
    parameter_name: null,
    openid_connect_url: null,
    flows: null,
    is_active: true,
    metadata: '{}',
    created_at: '',
    updated_at: '',
    deleted_at: null,
    ...overrides,
  };
}

function makeDraft(overrides: Partial<ProjectSettingsDraft> = {}): ProjectSettingsDraft {
  return {
    currentProjectName: 'My API',
    apiOpenapiVersion: '3.1.0',
    apiTitle: 'My API',
    apiVersion: '1.0.0',
    apiDescription: '',
    apiTermsOfService: '',
    apiContact: { name: '', email: '', url: '' },
    apiLicense: { name: '', url: '' },
    apiServers: [],
    apiExternalDocs: { description: '', url: '' },
    enabledSecuritySchemes: [],
    securityScopes: {},
    removedLegacySchemes: [],
    ...overrides,
  };
}

const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useSpecStore.setState(initialSpecState, true);
  vi.mocked(fetchSecurityTypes).mockResolvedValue([makeType()]);
});

describe('SecuritySettingsPanel — catalog toggling', () => {
  it('toggling an unchecked scheme patches enabledSecuritySchemes with it appended', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SecuritySettingsPanel draft={makeDraft()} onChange={onChange} />);

    await screen.findByText('Bearer Token');
    await user.click(screen.getByText('Bearer Token'));

    expect(onChange).toHaveBeenLastCalledWith({ enabledSecuritySchemes: ['bearerAuth'] });
  });

  it('toggling a checked scheme patches enabledSecuritySchemes with it removed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SecuritySettingsPanel draft={makeDraft({ enabledSecuritySchemes: ['bearerAuth'] })} onChange={onChange} />);

    await screen.findByText('Bearer Token');
    await user.click(screen.getByText('Bearer Token'));

    expect(onChange).toHaveBeenLastCalledWith({ enabledSecuritySchemes: [] });
  });

  it('editing scopes for an enabled oauth2-style scheme patches securityScopes, keyed by openapi_name', async () => {
    vi.mocked(fetchSecurityTypes).mockResolvedValue([
      makeType({
        id: 'oauth2-id',
        openapi_name: 'oauth2',
        flows: JSON.stringify({ authorizationCode: { scopes: { 'read:things': 'Read things' } } }),
      }),
    ]);
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SecuritySettingsPanel draft={makeDraft({ enabledSecuritySchemes: ['oauth2'] })} onChange={onChange} />);

    const scopesInput = await screen.findByPlaceholderText('Comma-separated, e.g. read:charges, write:charges');
    await user.type(scopesInput, '!');

    expect(onChange).toHaveBeenLastCalledWith({ securityScopes: { oauth2: 'read:things!' } });
  });
});

describe('SecuritySettingsPanel — legacy schemes', () => {
  it('shows a legacy card for a scheme used by an endpoint but absent from the catalog', async () => {
    useSpecStore.getState().pickMethod('/a', 'GET');
    const endpoint = useSpecStore.getState().endpoints[0];
    useSpecStore.getState().addSecurity(endpoint.id, 'customLegacyScheme');

    render(<SecuritySettingsPanel draft={makeDraft()} onChange={vi.fn()} />);

    expect(await screen.findByText(/customLegacyScheme \(Legacy\)/)).toBeInTheDocument();
  });

  it('clicking a legacy card patches removedLegacySchemes with it appended', async () => {
    useSpecStore.getState().pickMethod('/a', 'GET');
    const endpoint = useSpecStore.getState().endpoints[0];
    useSpecStore.getState().addSecurity(endpoint.id, 'customLegacyScheme');

    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SecuritySettingsPanel draft={makeDraft()} onChange={onChange} />);

    const card = await screen.findByText(/customLegacyScheme \(Legacy\)/);
    await user.click(card);

    expect(onChange).toHaveBeenLastCalledWith({ removedLegacySchemes: ['customLegacyScheme'] });
  });

  it('a scheme already listed in removedLegacySchemes does not render a card', async () => {
    useSpecStore.getState().pickMethod('/a', 'GET');
    const endpoint = useSpecStore.getState().endpoints[0];
    useSpecStore.getState().addSecurity(endpoint.id, 'customLegacyScheme');

    render(
      <SecuritySettingsPanel draft={makeDraft({ removedLegacySchemes: ['customLegacyScheme'] })} onChange={vi.fn()} />,
    );

    await screen.findByText('Bearer Token');
    expect(screen.queryByText(/customLegacyScheme \(Legacy\)/)).not.toBeInTheDocument();
  });
});

describe('SecuritySettingsPanel — reconciliation', () => {
  it('auto-enables a catalog scheme already required by an endpoint, once, after the fetch completes', async () => {
    useSpecStore.getState().pickMethod('/a', 'GET');
    const endpoint = useSpecStore.getState().endpoints[0];
    useSpecStore.getState().addSecurity(endpoint.id, 'bearerAuth');

    const onChange = vi.fn();
    render(<SecuritySettingsPanel draft={makeDraft()} onChange={onChange} />);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ enabledSecuritySchemes: ['bearerAuth'] }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('does not re-enable a scheme already absent from the draft on unrelated draft changes', async () => {
    useSpecStore.getState().pickMethod('/a', 'GET');
    const endpoint = useSpecStore.getState().endpoints[0];
    useSpecStore.getState().addSecurity(endpoint.id, 'bearerAuth');

    const onChange = vi.fn();
    const { rerender } = render(<SecuritySettingsPanel draft={makeDraft()} onChange={onChange} />);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));

    onChange.mockClear();
    rerender(<SecuritySettingsPanel draft={makeDraft({ enabledSecuritySchemes: [] })} onChange={onChange} />);

    expect(onChange).not.toHaveBeenCalled();
  });
});
