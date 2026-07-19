import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadWorkspaceDialog } from './LoadWorkspaceDialog';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { listServerWorkspaces, getServerWorkspace } from '../../lib/api/workspaces';

vi.mock('../../lib/api/workspaces', () => ({
  listServerWorkspaces: vi.fn(),
  getServerWorkspace: vi.fn(),
}));

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
  vi.clearAllMocks();
});

const VALID_SPEC_JSON = JSON.stringify({
  openapi: '3.1.0',
  info: { title: 'Saved API', version: '2.0.0' },
  paths: { '/things': { get: { responses: { '200': { description: 'OK' } } } } },
});

describe('LoadWorkspaceDialog', () => {
  it('shows a loading state, then the fetched project list', async () => {
    vi.mocked(listServerWorkspaces).mockResolvedValue([
      { id: 'ws-1', name: 'Saved API', updatedAt: new Date().toISOString() },
    ]);
    render(<LoadWorkspaceDialog />);

    expect(screen.getByText(/Loading your projects/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Saved API')).toBeInTheDocument());
  });

  it('shows an empty state when the server has no projects', async () => {
    vi.mocked(listServerWorkspaces).mockResolvedValue([]);
    render(<LoadWorkspaceDialog />);

    await waitFor(() => expect(screen.getByText(/No projects saved to the server yet/)).toBeInTheDocument());
  });

  it('shows an error message when the list call fails', async () => {
    vi.mocked(listServerWorkspaces).mockRejectedValue(new Error('/workspaces responded 404 Not Found'));
    render(<LoadWorkspaceDialog />);

    await waitFor(() => expect(screen.getByText('/workspaces responded 404 Not Found')).toBeInTheDocument());
  });

  it('Open is disabled until a project is selected', async () => {
    const user = userEvent.setup();
    vi.mocked(listServerWorkspaces).mockResolvedValue([
      { id: 'ws-1', name: 'Saved API', updatedAt: new Date().toISOString() },
    ]);
    render(<LoadWorkspaceDialog />);
    await waitFor(() => expect(screen.getByText('Saved API')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: 'Open' })).toBeDisabled();

    await user.click(screen.getByText('Saved API'));
    expect(screen.getByRole('button', { name: 'Open' })).toBeEnabled();
  });

  it('Open fetches the full document and loads it into Workspace Settings', async () => {
    const user = userEvent.setup();
    vi.mocked(listServerWorkspaces).mockResolvedValue([
      { id: 'ws-1', name: 'Saved API', updatedAt: new Date().toISOString() },
    ]);
    vi.mocked(getServerWorkspace).mockResolvedValue({
      id: 'ws-1',
      name: 'Saved API',
      updatedAt: new Date().toISOString(),
      specJson: VALID_SPEC_JSON,
    });
    render(<LoadWorkspaceDialog />);
    await waitFor(() => expect(screen.getByText('Saved API')).toBeInTheDocument());

    await user.click(screen.getByText('Saved API'));
    await user.click(screen.getByRole('button', { name: 'Open' }));

    await waitFor(() => expect(useAppStore.getState().workspaceSettingsOpen).toBe(true));
    expect(useSpecStore.getState().hasDocument).toBe(true);
    expect(useAppStore.getState().currentWorkspaceId).toBe('ws-1');
  });

  it('double-clicking a project opens it directly', async () => {
    const user = userEvent.setup();
    vi.mocked(listServerWorkspaces).mockResolvedValue([
      { id: 'ws-1', name: 'Saved API', updatedAt: new Date().toISOString() },
    ]);
    vi.mocked(getServerWorkspace).mockResolvedValue({
      id: 'ws-1',
      name: 'Saved API',
      updatedAt: new Date().toISOString(),
      specJson: VALID_SPEC_JSON,
    });
    render(<LoadWorkspaceDialog />);
    await waitFor(() => expect(screen.getByText('Saved API')).toBeInTheDocument());

    await user.dblClick(screen.getByText('Saved API'));

    await waitFor(() => expect(useAppStore.getState().currentWorkspaceId).toBe('ws-1'));
    expect(useAppStore.getState().workspaceSettingsOpen).toBe(true);
  });

  it('Import OpenAPI Document loads the file into Workspace Settings and closes this dialog', async () => {
    const user = userEvent.setup();
    vi.mocked(listServerWorkspaces).mockResolvedValue([]);
    useAppStore.setState({ loadWorkspaceOpen: true });
    render(<LoadWorkspaceDialog />);
    await waitFor(() => expect(screen.getByText(/No projects saved to the server yet/)).toBeInTheDocument());

    const file = new File(
      [
        JSON.stringify({
          openapi: '3.1.0',
          info: { title: 'Imported API', version: '1.0.0' },
          paths: { '/things': { get: { responses: { '200': { description: 'OK' } } } } },
        }),
      ],
      'spec.json',
      { type: 'application/json' },
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    const app = useAppStore.getState();
    expect(useSpecStore.getState().hasDocument).toBe(true);
    expect(app.currentWorkspaceName).toBe('Imported API');
    expect(app.workspaceSettingsOpen).toBe(true);
    expect(app.loadWorkspaceOpen).toBe(false);
  });

  it('Load from Version Control closes this dialog and opens the version control modal', async () => {
    const user = userEvent.setup();
    vi.mocked(listServerWorkspaces).mockResolvedValue([]);
    render(<LoadWorkspaceDialog />);

    await user.click(screen.getByRole('button', { name: 'Load from Version Control' }));

    expect(useAppStore.getState().loadWorkspaceOpen).toBe(false);
    expect(useAppStore.getState().workspaceFromVersionControlOpen).toBe(true);
  });

  it('Cancel and the close button both close the dialog', async () => {
    const user = userEvent.setup();
    vi.mocked(listServerWorkspaces).mockResolvedValue([]);
    useAppStore.setState({ loadWorkspaceOpen: true });
    render(<LoadWorkspaceDialog />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(useAppStore.getState().loadWorkspaceOpen).toBe(false);

    useAppStore.setState({ loadWorkspaceOpen: true });
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(useAppStore.getState().loadWorkspaceOpen).toBe(false);
  });
});
