import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeneralSettingsPanel } from './GeneralSettingsPanel';
import type { ProjectSettingsDraft } from '../Project/projectSettingsDraft';
import { listLicenses } from '../../lib/api/licenses';
import { listOpenApiVersions } from '../../lib/api/openApiVersions';

vi.mock('../../lib/api/licenses', () => ({
  listLicenses: vi.fn(),
}));

vi.mock('../../lib/api/openApiVersions', () => ({
  listOpenApiVersions: vi.fn(),
}));

const mockedListLicenses = vi.mocked(listLicenses);
const mockedListOpenApiVersions = vi.mocked(listOpenApiVersions);

function makeDraft(overrides: Partial<ProjectSettingsDraft> = {}): ProjectSettingsDraft {
  return {
    currentProjectName: 'My API',
    apiOpenapiVersion: '3.1.0',
    apiTitle: 'My API Doc',
    apiVersion: '1.0.0',
    apiDescription: '',
    apiTermsOfService: '',
    apiContact: { name: '', email: '', url: '' },
    apiLicense: { id: '', name: 'Proprietary', spdxId: '', url: '' },
    apiServers: [],
    apiExternalDocs: { description: '', url: '' },
    enabledSecuritySchemes: [],
    securityScopes: {},
    removedLegacySchemes: [],
    ...overrides,
  };
}

beforeEach(() => {
  mockedListLicenses.mockResolvedValue([
    {
      id: 'apache-id',
      name: 'Apache License 2.0',
      spdx_id: 'Apache-2.0',
      url: 'https://spdx.org/licenses/Apache-2.0.html',
    },
    {
      id: 'mit-id',
      name: 'MIT License',
      spdx_id: 'MIT',
      url: 'https://spdx.org/licenses/MIT.html',
    },
  ]);

  mockedListOpenApiVersions.mockResolvedValue([
    {
      id: 'oas-320',
      version: '3.2.0',
      display_name: 'OpenAPI 3.2.0',
      is_default: false,
      supports_import: false,
      supports_export: false,
      supports_validation: false,
      supports_visual_editor: true,
      released_at: null,
      deprecated_at: null,
    },
    {
      id: 'oas-311',
      version: '3.1.1',
      display_name: 'OpenAPI 3.1.1',
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
  ]);
});

describe('GeneralSettingsPanel — Project Name', () => {
  it('is the first field, showing the current project name', () => {
    render(<GeneralSettingsPanel draft={makeDraft()} onChange={vi.fn()} />);

    const fieldLabels = screen.getAllByText(/Project Name|OpenAPI Version/);
    expect(fieldLabels[0]).toHaveTextContent('Project Name');
    expect(screen.getByDisplayValue('My API')).toBeInTheDocument();
  });

  it('shows an empty field with a placeholder when no project is named yet', () => {
    render(<GeneralSettingsPanel draft={makeDraft({ currentProjectName: null })} onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText('Untitled Project')).toHaveValue('');
  });

  it('editing the field calls onChange with the new value, without trimming or falling back', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GeneralSettingsPanel draft={makeDraft({ currentProjectName: '' })} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText('Untitled Project'), 'X');

    expect(onChange).toHaveBeenLastCalledWith({ currentProjectName: 'X' });
  });

  it('clearing the field patches an empty string (not forced to a fallback name)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GeneralSettingsPanel draft={makeDraft({ currentProjectName: 'My API' })} onChange={onChange} />);

    await user.clear(screen.getByDisplayValue('My API'));

    expect(onChange).toHaveBeenLastCalledWith({ currentProjectName: '' });
  });

  it('does not write to any store — purely draft/onChange-driven', async () => {
    const user = userEvent.setup();
    const draft = makeDraft({ currentProjectName: 'My API' });
    render(<GeneralSettingsPanel draft={draft} onChange={vi.fn()} />);

    await user.type(screen.getByDisplayValue('My API'), '!');

    expect(draft.currentProjectName).toBe('My API');
  });
});

describe('GeneralSettingsPanel — existing fields', () => {
  it('still renders the OpenAPI project fields', () => {
    render(<GeneralSettingsPanel draft={makeDraft()} onChange={vi.fn()} />);
    expect(screen.getByText('OpenAPI Version')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('editing Title calls onChange with a patch, reading from draft not a store', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GeneralSettingsPanel draft={makeDraft({ apiTitle: 'Old' })} onChange={onChange} />);

    await user.type(screen.getByDisplayValue('Old'), '!');

    expect(onChange).toHaveBeenLastCalledWith({ apiTitle: 'Old!' });
  });

  it('editing Contact name patches apiContact, preserving the other contact fields', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const draft = makeDraft({ apiContact: { name: '', email: 'a@b.com', url: 'https://x' } });
    render(<GeneralSettingsPanel draft={draft} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText('Name'), 'J');

    expect(onChange).toHaveBeenLastCalledWith({ apiContact: { name: 'J', email: 'a@b.com', url: 'https://x' } });
  });
});

describe('GeneralSettingsPanel — governed OpenAPI version catalog', () => {
  it('renders the backend catalog in backend-defined order and labels preview-only versions', async () => {
    render(<GeneralSettingsPanel draft={makeDraft()} onChange={vi.fn()} />);

    const select = await screen.findByRole('combobox', { name: 'OpenAPI Version' });
    const options = Array.from((select as HTMLSelectElement).options);

    expect(options.map((option) => option.text)).toEqual([
      'OpenAPI 3.2.0 — editor preview',
      'OpenAPI 3.1.1',
      'OpenAPI 3.1.0',
    ]);
    expect(options[0]?.disabled).toBe(true);
    expect(options[1]?.disabled).toBe(false);
    expect(options[2]?.disabled).toBe(false);
    expect(mockedListOpenApiVersions).toHaveBeenCalledTimes(1);
  });

  it('patches a selectable OpenAPI version', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GeneralSettingsPanel draft={makeDraft()} onChange={onChange} />);

    const select = await screen.findByRole('combobox', { name: 'OpenAPI Version' });
    await user.selectOptions(select, '3.1.1');

    expect(onChange).toHaveBeenLastCalledWith({ apiOpenapiVersion: '3.1.1' });
  });

  it('preserves an existing project version that is absent from the current catalog', async () => {
    render(<GeneralSettingsPanel draft={makeDraft({ apiOpenapiVersion: '2.0.0' })} onChange={vi.fn()} />);

    const select = await screen.findByRole('combobox', { name: 'OpenAPI Version' });
    expect(select).toHaveValue('2.0.0');
    expect((select as HTMLSelectElement).options[0]?.text).toBe('2.0.0 (Current project)');
  });

  it('preserves an existing preview-only catalog version while preventing new selection', async () => {
    render(<GeneralSettingsPanel draft={makeDraft({ apiOpenapiVersion: '3.2.0' })} onChange={vi.fn()} />);

    const select = await screen.findByRole('combobox', { name: 'OpenAPI Version' });
    const preview = Array.from((select as HTMLSelectElement).options).find((option) => option.value === '3.2.0');

    expect(select).toHaveValue('3.2.0');
    expect(preview?.text).toBe('OpenAPI 3.2.0 — editor preview');
    expect(preview?.disabled).toBe(true);
  });
});

describe('GeneralSettingsPanel — governed license catalog', () => {
  it('loads the public catalog and keeps Proprietary as the first option', async () => {
    render(<GeneralSettingsPanel draft={makeDraft()} onChange={vi.fn()} />);

    const select = await screen.findByRole('combobox', { name: 'License' });
    const options = Array.from((select as HTMLSelectElement).options).map((option) => option.text);

    expect(options).toEqual(['Proprietary', 'Apache License 2.0', 'MIT License']);
    expect(mockedListLicenses).toHaveBeenCalledTimes(1);
  });

  it('stores all catalog values when a license is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GeneralSettingsPanel draft={makeDraft()} onChange={onChange} />);

    const select = await screen.findByRole('combobox', { name: 'License' });
    await user.selectOptions(select, 'apache-id');

    expect(onChange).toHaveBeenLastCalledWith({
      apiLicense: {
        id: 'apache-id',
        name: 'Apache License 2.0',
        spdxId: 'Apache-2.0',
        url: 'https://spdx.org/licenses/Apache-2.0.html',
      },
    });
  });

  it('shows the selected license URL as an external link and hides it for Proprietary', () => {
    const { rerender } = render(
      <GeneralSettingsPanel
        draft={makeDraft({
          apiLicense: {
            id: 'apache-id',
            name: 'Apache License 2.0',
            spdxId: 'Apache-2.0',
            url: 'https://spdx.org/licenses/Apache-2.0.html',
          },
        })}
        onChange={vi.fn()}
      />,
    );

    const link = screen.getByRole('link', { name: /spdx.org\/licenses\/Apache-2.0.html/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    rerender(<GeneralSettingsPanel draft={makeDraft()} onChange={vi.fn()} />);
    expect(screen.queryByText('License URL')).not.toBeInTheDocument();
  });
});
