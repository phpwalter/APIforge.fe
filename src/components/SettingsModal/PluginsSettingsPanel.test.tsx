import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PluginsSettingsPanel } from './PluginsSettingsPanel';
import { useAppStore } from '../../state/useAppStore';
import { fetchAiStatus } from '../../lib/api/ai';

vi.mock('../../lib/api/ai', () => ({
  fetchAiStatus: vi.fn(() => new Promise(() => {})), // left pending — this panel just tests the toggle/nav wiring
}));

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
  vi.mocked(fetchAiStatus).mockClear();
});

describe('PluginsSettingsPanel', () => {
  it('defaults to the Installed tab, listing AI with its checkbox checked and its details shown', () => {
    render(<PluginsSettingsPanel />);

    expect(screen.getByRole('tab', { name: 'Installed' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Marketplace' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('checkbox', { name: 'Enable AI' })).toHaveAttribute('aria-checked', 'true');
    // Detail pane content — author/version line and the Disable action (since it starts enabled).
    expect(screen.getByText('APIforge · Built-in')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disable' })).toBeInTheDocument();
  });

  it('switching to Marketplace hides the installed list and shows an empty state', async () => {
    const user = userEvent.setup();
    render(<PluginsSettingsPanel />);

    await user.click(screen.getByRole('tab', { name: 'Marketplace' }));

    expect(screen.getByRole('tab', { name: 'Marketplace' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/No marketplace listings yet/)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Enable AI' })).not.toBeInTheDocument();
  });

  it("shows the plugin's own settings panel inline in the detail pane while it is enabled", async () => {
    render(<PluginsSettingsPanel />);
    // Lazily loaded (see types.ts), so it isn't present on the very first synchronous render.
    await waitFor(() => expect(screen.getByText('Status')).toBeInTheDocument()); // AiSettingsPanel's own content
  });

  it('the list checkbox disables the plugin and hides its inline settings panel', async () => {
    const user = userEvent.setup();
    render(<PluginsSettingsPanel />);

    await user.click(screen.getByRole('checkbox', { name: 'Enable AI' }));

    expect(screen.getByRole('checkbox', { name: 'Enable AI' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('button', { name: 'Enable' })).toBeInTheDocument();
    expect(screen.queryByText('Status')).not.toBeInTheDocument();
    expect(useAppStore.getState().enabledPluginIds.has('ai')).toBe(false);
  });

  it('the detail pane\'s Disable/Enable button toggles the same state as the list checkbox', async () => {
    const user = userEvent.setup();
    render(<PluginsSettingsPanel />);

    await user.click(screen.getByRole('button', { name: 'Disable' }));
    expect(screen.getByRole('checkbox', { name: 'Enable AI' })).toHaveAttribute('aria-checked', 'false');

    await user.click(screen.getByRole('button', { name: 'Enable' }));
    expect(screen.getByRole('checkbox', { name: 'Enable AI' })).toHaveAttribute('aria-checked', 'true');
    await waitFor(() => expect(screen.getByText('Status')).toBeInTheDocument());
  });

  it('search filters the installed list by plugin name', async () => {
    const user = userEvent.setup();
    render(<PluginsSettingsPanel />);

    await user.type(screen.getByPlaceholderText('Type to see options'), 'nonexistent plugin');

    expect(screen.queryByRole('checkbox', { name: 'Enable AI' })).not.toBeInTheDocument();
    expect(screen.getByText('No plugins match "nonexistent plugin".')).toBeInTheDocument();
  });

  it('a matching search keeps the plugin visible', async () => {
    const user = userEvent.setup();
    render(<PluginsSettingsPanel />);

    await user.type(screen.getByPlaceholderText('Type to see options'), 'ai');

    expect(screen.getByRole('checkbox', { name: 'Enable AI' })).toBeInTheDocument();
  });

  it('also lists GitHub, GitLab, and Bitbucket, all enabled by default alongside AI', () => {
    render(<PluginsSettingsPanel />);
    expect(screen.getByRole('checkbox', { name: 'Enable GitHub' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'Enable GitLab' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'Enable Bitbucket' })).toHaveAttribute('aria-checked', 'true');
  });

  it('selecting GitHub in the list shows its own connect UI in the detail pane, without disturbing AI', async () => {
    const user = userEvent.setup();
    render(<PluginsSettingsPanel />);

    await user.click(screen.getByRole('button', { name: 'View GitHub details' }));

    // Lazily loaded (see types.ts) — GitHubSettingsPanel's own content.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Connect with GitHub' })).toBeInTheDocument());
    expect(screen.getByRole('checkbox', { name: 'Enable AI' })).toHaveAttribute('aria-checked', 'true');
  });

  it('selecting GitLab shows its disabled stub connect button', async () => {
    const user = userEvent.setup();
    render(<PluginsSettingsPanel />);

    await user.click(screen.getByRole('button', { name: 'View GitLab details' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Connect with GitLab' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Connect with GitLab' })).toBeDisabled();
  });

  it('disabling GitHub does not disable AI', async () => {
    const user = userEvent.setup();
    render(<PluginsSettingsPanel />);

    await user.click(screen.getByRole('checkbox', { name: 'Enable GitHub' }));

    expect(useAppStore.getState().enabledPluginIds.has('github')).toBe(false);
    expect(useAppStore.getState().enabledPluginIds.has('ai')).toBe(true);
  });
});
