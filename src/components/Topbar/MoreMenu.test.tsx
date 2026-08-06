import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoreMenu } from './MoreMenu';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { saveNow } from '../../lib/projectAutosave';

vi.mock('../../lib/projectAutosave', () => ({ saveNow: vi.fn() }));

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
  vi.clearAllMocks();
  vi.mocked(saveNow).mockResolvedValue(undefined);
});

function noop() {}

function loadSavableProject() {
  useSpecStore.getState().loadSampleProject();
  useAppStore.setState({
    moreMenuOpen: true,
    currentProjectId: 'local-project-id',
    currentProjectName: 'My API',
    isNewProject: true,
  });
}

describe('MoreMenu — Save Project', () => {
  it('keeps Save Project disabled when no project content is available', () => {
    render(<MoreMenu onExport={noop} onShare={noop} />);
    expect(screen.getByRole('button', { name: /Save Project/ })).toBeDisabled();
  });

  it('shows an enabled Save to Server action without a Coming soon label', async () => {
    const user = userEvent.setup();
    loadSavableProject();
    render(<MoreMenu onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /Save Project/ }));

    expect(screen.getByRole('button', { name: 'Save to Server' })).toBeEnabled();
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
    expect(screen.getByText('Export OpenAPI to disk')).toBeInTheDocument();
  });

  it('explicitly creates or updates the server project and closes the menu on success', async () => {
    const user = userEvent.setup();
    loadSavableProject();
    render(<MoreMenu onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /Save Project/ }));
    await user.click(screen.getByRole('button', { name: 'Save to Server' }));

    await waitFor(() =>
      expect(saveNow).toHaveBeenCalledWith({ persistNewProject: true, requireServer: true }),
    );
    expect(useAppStore.getState().moreMenuOpen).toBe(false);
  });

  it('keeps the menu open and displays a server-save error', async () => {
    const user = userEvent.setup();
    loadSavableProject();
    vi.mocked(saveNow).mockRejectedValue(new Error('Project creation failed'));
    render(<MoreMenu onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /Save Project/ }));
    await user.click(screen.getByRole('button', { name: 'Save to Server' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Project creation failed');
    expect(useAppStore.getState().moreMenuOpen).toBe(true);
  });

  it('exports to disk independently of server saving', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    loadSavableProject();
    render(<MoreMenu onExport={onExport} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /Save Project/ }));
    await user.click(screen.getByRole('button', { name: 'Export OpenAPI to disk' }));

    expect(onExport).toHaveBeenCalledOnce();
    expect(saveNow).not.toHaveBeenCalled();
  });
});

describe('MoreMenu — project navigation', () => {
  it('opens the Load Project view', async () => {
    const user = userEvent.setup();
    render(<MoreMenu onExport={noop} onShare={noop} />);
    await user.click(screen.getByRole('button', { name: /Load Project/ }));
    expect(useAppStore.getState().loadProjectOpen).toBe(true);
  });

  it('opens Project Settings only when a document is active', async () => {
    const user = userEvent.setup();
    render(<MoreMenu onExport={noop} onShare={noop} />);
    expect(screen.getByRole('button', { name: 'Project Settings' })).toBeDisabled();

    useSpecStore.getState().loadSampleProject();
    const { unmount } = render(<MoreMenu onExport={noop} onShare={noop} />);
    await user.click(screen.getAllByRole('button', { name: 'Project Settings' }).at(-1)!);
    expect(useAppStore.getState().projectSettingsOpen).toBe(true);
    unmount();
  });
});
