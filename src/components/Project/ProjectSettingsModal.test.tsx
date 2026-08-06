import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectSettingsModal } from './ProjectSettingsModal';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { saveNow } from '../../lib/projectAutosave';

vi.mock('../../lib/projectAutosave', () => ({ saveNow: vi.fn() }));
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
  vi.mocked(saveNow).mockResolvedValue(undefined);
});

describe('ProjectSettingsModal', () => {
  it('shows all project settings categories', () => {
    render(<ProjectSettingsModal />);
    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Servers & External Docs/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Security Schemes/ })).toBeInTheDocument();
  });

  it('starts with OK and Apply disabled', () => {
    render(<ProjectSettingsModal />);
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'SAVE' })).not.toBeInTheDocument();
  });

  it('enables OK and Apply after editing', async () => {
    const user = userEvent.setup();
    render(<ProjectSettingsModal />);
    await user.type(screen.getByPlaceholderText('Untitled Project'), 'X');
    expect(screen.getByRole('button', { name: 'OK' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
  });

  it('OK commits locally and closes', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ projectSettingsOpen: true });
    render(<ProjectSettingsModal />);
    await user.type(screen.getByPlaceholderText('Untitled Project'), 'X');
    await user.click(screen.getByRole('button', { name: 'OK' }));
    expect(saveNow).toHaveBeenCalledWith();
    expect(useAppStore.getState().projectSettingsOpen).toBe(false);
  });

  it('Apply commits locally without closing', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ projectSettingsOpen: true });
    render(<ProjectSettingsModal />);
    await user.type(screen.getByPlaceholderText('Untitled Project'), 'X');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(saveNow).toHaveBeenCalledWith();
    expect(useAppStore.getState().projectSettingsOpen).toBe(true);
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('Cancel closes without committing changes', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ projectSettingsOpen: true, currentProjectName: 'Original' });
    render(<ProjectSettingsModal />);
    await user.type(screen.getByPlaceholderText('Untitled Project'), 'X');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(useAppStore.getState().currentProjectName).toBe('Original');
    expect(saveNow).not.toHaveBeenCalled();
  });
});
