import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsModal } from './SettingsModal';
import { useAppStore } from '../../state/useAppStore';

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
