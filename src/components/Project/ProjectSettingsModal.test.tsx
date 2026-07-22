import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectSettingsModal } from './ProjectSettingsModal';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { saveNow } from '../../lib/projectAutosave';

vi.mock('../../lib/projectAutosave', () => ({
  saveNow: vi.fn(),
}));

vi.mock('../../lib/api/securityTypes', () => ({
  fetchSecurityTypes: vi.fn(() => Promise.resolve([])),
  securityTypeHasScopes: vi.fn(() => false),
  scopesFromFlows: vi.fn(() => ''),
}));

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
  vi.clearAllMocks();
});

describe('ProjectSettingsModal', () => {
  it('defaults to the General panel, listing all three categories in the rail', () => {
    render(<ProjectSettingsModal />);

    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Servers & External Docs/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Security Schemes/ })).toBeInTheDocument();
  });

  it('switches to the Servers panel on click', async () => {
    const user = userEvent.setup();
    render(<ProjectSettingsModal />);

    await user.click(screen.getByRole('button', { name: /Servers & External Docs/ }));

    expect(screen.getByRole('button', { name: /Servers & External Docs/ })).toHaveAttribute('data-active', 'true');
  });

  it('switches to the Security Schemes panel on click', async () => {
    const user = userEvent.setup();
    render(<ProjectSettingsModal />);

    await user.click(screen.getByRole('button', { name: /Security Schemes/ }));

    expect(screen.getByRole('button', { name: /Security Schemes/ })).toHaveAttribute('data-active', 'true');
  });

  it('close button closes the modal', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ projectSettingsOpen: true });
    render(<ProjectSettingsModal />);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(useAppStore.getState().projectSettingsOpen).toBe(false);
  });

  it('OK and Apply start disabled, Cancel starts enabled', () => {
    render(<ProjectSettingsModal />);

    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  });

  it('editing a field enables OK and Apply', async () => {
    const user = userEvent.setup();
    render(<ProjectSettingsModal />);

    await user.type(screen.getByPlaceholderText('Untitled Project'), '!');

    expect(screen.getByRole('button', { name: 'OK' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
  });

  it('editing a field on one tab keeps OK/Apply enabled after switching to another tab', async () => {
    const user = userEvent.setup();
    render(<ProjectSettingsModal />);

    await user.type(screen.getByPlaceholderText('Untitled Project'), '!');
    await user.click(screen.getByRole('button', { name: /Servers & External Docs/ }));

    expect(screen.getByRole('button', { name: 'OK' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
  });

  it('OK commits the draft to both stores, autosaves, and closes the modal', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ projectSettingsOpen: true });
    render(<ProjectSettingsModal />);

    await user.type(screen.getByPlaceholderText('Untitled Project'), 'X');
    await user.click(screen.getByRole('button', { name: 'OK' }));

    expect(useAppStore.getState().currentProjectName).toBe('X');
    expect(saveNow).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().projectSettingsOpen).toBe(false);
  });

  it('Apply commits the draft, autosaves, disables itself, and does not close the modal', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ projectSettingsOpen: true });
    render(<ProjectSettingsModal />);

    await user.type(screen.getByPlaceholderText('Untitled Project'), 'X');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(useAppStore.getState().currentProjectName).toBe('X');
    expect(saveNow).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().projectSettingsOpen).toBe(true);
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('Apply does not disable OK — it stays enabled to dismiss the dialog', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ projectSettingsOpen: true });
    render(<ProjectSettingsModal />);

    await user.type(screen.getByPlaceholderText('Untitled Project'), 'X');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(screen.getByRole('button', { name: 'OK' })).toBeEnabled();
  });

  it('Cancel closes the modal without writing any edits to either store', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ projectSettingsOpen: true, currentProjectName: 'Original' });
    render(<ProjectSettingsModal />);

    await user.type(screen.getByPlaceholderText('Untitled Project'), 'X');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useAppStore.getState().currentProjectName).toBe('Original');
    expect(saveNow).not.toHaveBeenCalled();
    expect(useAppStore.getState().projectSettingsOpen).toBe(false);
  });
});
