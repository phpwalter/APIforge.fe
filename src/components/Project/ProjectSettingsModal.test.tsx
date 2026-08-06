import { render, screen, waitFor } from '@testing-library/react';
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
  useAppStore.setState({ isNewProject: false });
  vi.clearAllMocks();
  vi.mocked(saveNow).mockResolvedValue(undefined);
});

describe('ProjectSettingsModal', () => {
  it('defaults to the General panel and lists all project categories', () => {
    render(<ProjectSettingsModal />);

    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Servers & External Docs/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Security Schemes/ })).toBeInTheDocument();
  });

  it('switches project settings panels', async () => {
    const user = userEvent.setup();
    render(<ProjectSettingsModal />);

    await user.click(screen.getByRole('button', { name: /Servers & External Docs/ }));
    expect(screen.getByRole('button', { name: /Servers & External Docs/ })).toHaveAttribute('data-active', 'true');

    await user.click(screen.getByRole('button', { name: /Security Schemes/ }));
    expect(screen.getByRole('button', { name: /Security Schemes/ })).toHaveAttribute('data-active', 'true');
  });

  it('closes from the close button', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ projectSettingsOpen: true });
    render(<ProjectSettingsModal />);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(useAppStore.getState().projectSettingsOpen).toBe(false);
  });

  it('keeps OK and Apply disabled for an unchanged existing project', () => {
    render(<ProjectSettingsModal />);

    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  });

  it('enables OK and Apply after an existing project is edited', async () => {
    const user = userEvent.setup();
    render(<ProjectSettingsModal />);

    await user.type(screen.getByPlaceholderText('Untitled Project'), '!');

    expect(screen.getByRole('button', { name: 'OK' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
  });

  it('OK persists an existing project and closes the modal', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ projectSettingsOpen: true });
    render(<ProjectSettingsModal />);

    await user.type(screen.getByPlaceholderText('Untitled Project'), 'X');
    await user.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => expect(saveNow).toHaveBeenCalledWith({ persistNewProject: true }));
    expect(useAppStore.getState().currentProjectName).toBe('X');
    expect(useAppStore.getState().projectSettingsOpen).toBe(false);
  });

  it('Apply persists changes without closing and resets the dirty state', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ projectSettingsOpen: true });
    render(<ProjectSettingsModal />);

    await user.type(screen.getByPlaceholderText('Untitled Project'), 'X');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(saveNow).toHaveBeenCalledWith({ persistNewProject: true }));
    expect(useAppStore.getState().projectSettingsOpen).toBe(true);
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'OK' })).toBeEnabled();
  });

  it('shows SAVE for a new imported project and allows first save without an edit', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      projectSettingsOpen: true,
      isNewProject: true,
      currentProjectId: 'local-import-id',
      currentProjectName: 'Imported API',
    });
    vi.mocked(saveNow).mockImplementation(async () => {
      useAppStore.setState({
        isNewProject: false,
        currentProjectId: 'server-project-id',
        saveState: 'saved',
      });
    });

    render(<ProjectSettingsModal />);

    const saveButton = screen.getByRole('button', { name: 'SAVE' });
    expect(saveButton).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();

    await user.click(saveButton);

    await waitFor(() => expect(saveNow).toHaveBeenCalledWith({ persistNewProject: true }));
    expect(useAppStore.getState().currentProjectId).toBe('server-project-id');
    expect(useAppStore.getState().isNewProject).toBe(false);
    expect(useAppStore.getState().projectSettingsOpen).toBe(false);
  });

  it('keeps a new project open and reports a first-save failure', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      projectSettingsOpen: true,
      isNewProject: true,
      currentProjectId: 'local-import-id',
      currentProjectName: 'Imported API',
    });
    vi.mocked(saveNow).mockRejectedValue(new Error('Project creation failed'));

    render(<ProjectSettingsModal />);
    await user.click(screen.getByRole('button', { name: 'SAVE' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Project creation failed');
    expect(useAppStore.getState().projectSettingsOpen).toBe(true);
    expect(useAppStore.getState().isNewProject).toBe(true);
  });

  it('Cancel closes without committing draft edits', async () => {
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
