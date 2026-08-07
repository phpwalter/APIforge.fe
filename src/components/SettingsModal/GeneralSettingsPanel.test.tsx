import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeneralSettingsPanel } from './GeneralSettingsPanel';
import type { ProjectSettingsDraft } from '../Project/projectSettingsDraft';
import { listLicenses } from '../../lib/api/licenses';

vi.mock('../../lib/api/licenses', () => ({
  listLicenses: vi.fn(),
}));

const mockedListLicenses = vi.mocked(listLicenses);

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
