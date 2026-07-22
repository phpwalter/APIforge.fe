import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServersSettingsPanel } from './ServersSettingsPanel';
import type { ProjectSettingsDraft } from '../Project/projectSettingsDraft';

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

describe('ServersSettingsPanel — Servers list', () => {
  it('shows an empty state when there are no servers', () => {
    render(<ServersSettingsPanel draft={makeDraft()} onChange={vi.fn()} />);

    expect(screen.getByText('No servers defined.')).toBeInTheDocument();
  });

  it('adding a server patches apiServers with an appended empty string', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ServersSettingsPanel draft={makeDraft({ apiServers: ['https://a.example.com'] })} onChange={onChange} />);

    await user.click(screen.getByTitle('Add server'));

    expect(onChange).toHaveBeenLastCalledWith({ apiServers: ['https://a.example.com', ''] });
  });

  it('editing a server URL by index patches only that entry', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const draft = makeDraft({ apiServers: ['https://a.example.com', 'https://b.example.com'] });
    render(<ServersSettingsPanel draft={draft} onChange={onChange} />);

    const inputs = screen.getAllByPlaceholderText('https://api.example.com');
    await user.type(inputs[1], '!');

    expect(onChange).toHaveBeenLastCalledWith({
      apiServers: ['https://a.example.com', 'https://b.example.com!'],
    });
  });

  it('removing a server by index patches apiServers without that entry', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const draft = makeDraft({ apiServers: ['https://a.example.com', 'https://b.example.com'] });
    render(<ServersSettingsPanel draft={draft} onChange={onChange} />);

    await user.click(screen.getAllByTitle('Remove server')[0]);

    expect(onChange).toHaveBeenLastCalledWith({ apiServers: ['https://b.example.com'] });
  });
});

describe('ServersSettingsPanel — External Docs', () => {
  it('editing the description patches apiExternalDocs, preserving the url', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const draft = makeDraft({ apiExternalDocs: { description: '', url: 'https://docs.example.com' } });
    render(<ServersSettingsPanel draft={draft} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText('Description'), 'D');

    expect(onChange).toHaveBeenLastCalledWith({
      apiExternalDocs: { description: 'D', url: 'https://docs.example.com' },
    });
  });

  it('editing the url patches apiExternalDocs, preserving the description', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const draft = makeDraft({ apiExternalDocs: { description: 'Docs', url: '' } });
    render(<ServersSettingsPanel draft={draft} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText('https://docs.example.com'), 'U');

    expect(onChange).toHaveBeenLastCalledWith({
      apiExternalDocs: { description: 'Docs', url: 'U' },
    });
  });
});
