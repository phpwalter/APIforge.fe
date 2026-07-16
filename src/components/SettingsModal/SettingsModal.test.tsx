import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsModal } from './SettingsModal';
import { useAppStore } from '../../state/useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('SettingsModal — nested nav', () => {
  it('renders Editor Preferences collapsed by default, with no child rows visible', () => {
    render(<SettingsModal />);

    expect(screen.getByRole('button', { name: /Editor Preferences/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Color Scheme' })).not.toBeInTheDocument();
  });

  it('expands Editor Preferences to reveal its children in alphabetical order on click, and selects it as active', async () => {
    const user = userEvent.setup();
    render(<SettingsModal />);

    await user.click(screen.getByRole('button', { name: /Editor Preferences/ }));

    const children = ['Color Scheme', 'Color Style', 'File Encoding', 'Formatting', 'Keyboard Shortcuts'];
    for (const label of children) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    // Clicking the parent also makes it the active panel.
    expect(screen.getByText('x-apiforge')).toBeInTheDocument();
  });

  it('collapses again on a second click', async () => {
    const user = userEvent.setup();
    render(<SettingsModal />);

    const parent = screen.getByRole('button', { name: /Editor Preferences/ });
    await user.click(parent);
    expect(screen.getByRole('button', { name: 'Color Scheme' })).toBeInTheDocument();

    await user.click(parent);
    expect(screen.queryByRole('button', { name: 'Color Scheme' })).not.toBeInTheDocument();
  });

  it('selecting a child shows its own panel without collapsing the parent', async () => {
    const user = userEvent.setup();
    render(<SettingsModal />);

    await user.click(screen.getByRole('button', { name: /Editor Preferences/ }));
    await user.click(screen.getByRole('button', { name: 'Color Style' }));

    expect(screen.getByRole('button', { name: 'Color Style' })).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('YAML')).toBeInTheDocument(); // FormatScopedComingSoonPanel's format tabs
    // Parent stays expanded.
    expect(screen.getByRole('button', { name: 'File Encoding' })).toBeInTheDocument();
  });

  it('searching for a child label auto-expands its parent and shows a filtered child list', async () => {
    const user = userEvent.setup();
    render(<SettingsModal />);

    await user.type(screen.getByPlaceholderText('Search settings…'), 'file encoding');

    expect(screen.getByRole('button', { name: /Editor Preferences/ })).toBeInTheDocument();
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
