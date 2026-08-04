import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsModal } from './SettingsModal';
import { useAppStore } from '../../state/useAppStore';

// PluginsSettingsPanel renders the AI plugin's own settings panel inline, which checks connection
// status on mount — keep that hermetic rather than letting it hit the network.
vi.mock('../../lib/api/ai', () => ({
  fetchAiStatus: vi.fn(() => new Promise(() => {})),
}));

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('SettingsModal — nested nav', () => {
  it('renders Code Preferences collapsed by default, with no child rows visible', () => {
    render(<SettingsModal />);

    expect(screen.getByRole('button', { name: /Code Preferences/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Color Scheme' })).not.toBeInTheDocument();
  });

  it('expands Code Preferences to reveal its children in alphabetical order on click, and selects it as active', async () => {
    const user = userEvent.setup();
    render(<SettingsModal />);

    await user.click(screen.getByRole('button', { name: /Code Preferences/ }));

    const children = ['Color Scheme', 'Color Style', 'File Encoding', 'Formatting', 'Keyboard Shortcuts'];
    for (const label of children) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    // Clicking the parent also makes it the active panel.
    expect(screen.getByText('x-apiforge')).toBeInTheDocument();
  });

  it('keeps Appearance as its own top-level category, directly below Code Preferences — not nested inside it', async () => {
    const user = userEvent.setup();
    render(<SettingsModal />);

    // Top-level rows render immediately; Code Preferences' children don't, until expanded.
    expect(screen.getByRole('button', { name: 'Appearance' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Color Scheme' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Appearance' }));
    expect(screen.getByRole('button', { name: 'Appearance' })).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('Themes')).toBeInTheDocument(); // AppearanceSettingsPanel's own content
  });

  it('collapses again on a second click', async () => {
    const user = userEvent.setup();
    render(<SettingsModal />);

    const parent = screen.getByRole('button', { name: /Code Preferences/ });
    await user.click(parent);
    expect(screen.getByRole('button', { name: 'Color Scheme' })).toBeInTheDocument();

    await user.click(parent);
    expect(screen.queryByRole('button', { name: 'Color Scheme' })).not.toBeInTheDocument();
  });

  it('selecting a child shows its own panel without collapsing the parent', async () => {
    const user = userEvent.setup();
    render(<SettingsModal />);

    await user.click(screen.getByRole('button', { name: /Code Preferences/ }));
    await user.click(screen.getByRole('button', { name: 'Color Style' }));

    expect(screen.getByRole('button', { name: 'Color Style' })).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('Token Types')).toBeInTheDocument(); // ColorStyleSettingsPanel's own content
    // Parent stays expanded.
    expect(screen.getByRole('button', { name: 'File Encoding' })).toBeInTheDocument();
  });

  it('GitHub, GitLab, and Bitbucket are not their own top-level categories — they live under Plugins now', () => {
    render(<SettingsModal />);
    expect(screen.queryByRole('button', { name: 'GitHub' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'GitLab' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bitbucket' })).not.toBeInTheDocument();
  });

  it('selects Plugins as a top-level category and shows its own dedicated panel, listing AI plus the provider plugins', async () => {
    const user = userEvent.setup();
    render(<SettingsModal />);

    await user.click(screen.getByRole('button', { name: 'Plugins' }));

    expect(screen.getByRole('button', { name: 'Plugins' })).toHaveAttribute('data-active', 'true');
    expect(screen.getByRole('checkbox', { name: 'Enable AI' })).toBeInTheDocument(); // PluginsSettingsPanel's own content
    expect(screen.getByRole('checkbox', { name: 'Enable GitHub' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Enable GitLab' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Enable Bitbucket' })).toBeInTheDocument();
  });

  it('shows the generic "Coming Soon" fallback for a child with no dedicated panel yet (Keyboard Shortcuts)', async () => {
    const user = userEvent.setup();
    render(<SettingsModal />);

    await user.click(screen.getByRole('button', { name: /Code Preferences/ }));
    await user.click(screen.getByRole('button', { name: 'Keyboard Shortcuts' }));

    expect(screen.getByRole('button', { name: 'Keyboard Shortcuts' })).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('searching for a child label auto-expands its parent and shows a filtered child list', async () => {
    const user = userEvent.setup();
    render(<SettingsModal />);

    await user.type(screen.getByPlaceholderText('Search settings…'), 'file encoding');

    expect(screen.getByRole('button', { name: /Code Preferences/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'File Encoding' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Color Scheme' })).not.toBeInTheDocument();
  });

  it('renders System Settings with Backup & Sync (renamed/moved from the old top-level Sync) as a child', async () => {
    const user = userEvent.setup();
    render(<SettingsModal />);

    expect(screen.queryByRole('button', { name: 'Sync' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /System Settings/ }));
    expect(screen.getByRole('button', { name: 'Backup & Sync' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Data Sharing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Language & Region' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Updates' })).toBeInTheDocument();
  });

  it('renders "Advanced Settings" (renamed from "Other Settings")', () => {
    render(<SettingsModal />);

    expect(screen.getByRole('button', { name: 'Advanced Settings' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Other Settings' })).not.toBeInTheDocument();
  });
});


describe('SettingsModal — Advanced Settings administrator access', () => {
  it('nests Methods and Headers beneath Advanced Settings and disables both for standard users', async () => {
    const user = userEvent.setup();
    render(<SettingsModal />);

    expect(screen.queryByRole('button', { name: 'Methods' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Headers' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Advanced Settings/ }));

    const methods = screen.getByRole('button', { name: 'Methods' });
    const headers = screen.getByRole('button', { name: 'Headers' });

    expect(methods).toBeDisabled();
    expect(headers).toBeDisabled();
    expect(methods).toHaveAttribute('title', 'Administrator access required');
    expect(headers).toHaveAttribute('title', 'Administrator access required');
    expect(screen.queryByRole('button', { name: 'Method Settings' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'HEADER Config' })).not.toBeInTheDocument();
  });

  it('enables Methods and Headers for the canonical company administrator role', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      userProfile: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        roles: ['administrator'],
      },
    });

    render(<SettingsModal />);

    await user.click(screen.getByRole('button', { name: /Advanced Settings/ }));

    const methods = screen.getByRole('button', { name: 'Methods' });
    const headers = screen.getByRole('button', { name: 'Headers' });

    expect(methods).toBeEnabled();
    expect(headers).toBeEnabled();

    await user.click(methods);
    expect(methods).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('Method Response Policies')).toBeInTheDocument();

    await user.click(headers);
    expect(headers).toHaveAttribute('data-active', 'true');
  });

  it('enables Methods and Headers when the API returns the administrator role in uppercase', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      userProfile: {
        name: 'Walter Torres',
        email: 'walter@example.com',
        roles: ['ADMINISTRATOR'],
      },
    });

    render(<SettingsModal />);
    await user.click(screen.getByRole('button', { name: /Advanced Settings/ }));

    expect(screen.getByRole('button', { name: 'Methods' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Headers' })).toBeEnabled();
  });

  it('keeps Methods and Headers disabled for non-administrator roles', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      userProfile: {
        name: 'Grace Hopper',
        email: 'grace@example.com',
        roles: ['owner', 'member'],
      },
    });

    render(<SettingsModal />);
    await user.click(screen.getByRole('button', { name: /Advanced Settings/ }));

    expect(screen.getByRole('button', { name: 'Methods' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Headers' })).toBeDisabled();
  });
});
