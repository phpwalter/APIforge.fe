import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadProjectDialog } from './LoadProjectDialog';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { listServerProjects, getServerProject } from '../../lib/api/projects';

vi.mock('../../lib/api/projects', () => ({
  listServerProjects: vi.fn(),
  getServerProject: vi.fn(),
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

const SERVER_PROJECT = {
  id: 'ws-1',
  name: 'Saved API',
  status: 'Active',
  updatedAt: '2026-07-18T00:00:00Z',
};

describe('LoadProjectDialog', () => {
  it('shows a loading state, then the fetched project list', async () => {
    vi.mocked(listServerProjects).mockResolvedValue([SERVER_PROJECT]);
    render(<LoadProjectDialog />);

    expect(screen.getByText(/Loading your projects/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Saved API')).toBeInTheDocument());
  });

  it('shows an empty state when the server has no projects', async () => {
    vi.mocked(listServerProjects).mockResolvedValue([]);
    render(<LoadProjectDialog />);

    await waitFor(() => expect(screen.getByText(/No projects saved to the server yet/)).toBeInTheDocument());
  });

  it('shows an error message when the list call fails', async () => {
    vi.mocked(listServerProjects).mockRejectedValue(new Error('/projects responded 404 Not Found'));
    render(<LoadProjectDialog />);

    await waitFor(() => expect(screen.getByText('/projects responded 404 Not Found')).toBeInTheDocument());
  });

  it('Open is disabled until a project is selected', async () => {
    const user = userEvent.setup();
    vi.mocked(listServerProjects).mockResolvedValue([SERVER_PROJECT]);
    render(<LoadProjectDialog />);
    await waitFor(() => expect(screen.getByText('Saved API')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: 'Open' })).toBeDisabled();

    await user.click(screen.getByText('Saved API'));
    expect(screen.getByRole('button', { name: 'Open' })).toBeEnabled();
  });

  it('Open fetches the full document and loads it into Project Settings', async () => {
    const user = userEvent.setup();
    vi.mocked(listServerProjects).mockResolvedValue([SERVER_PROJECT]);
    vi.mocked(getServerProject).mockResolvedValue({ ...SERVER_PROJECT, specJson: VALID_SPEC_JSON });
    render(<LoadProjectDialog />);
    await waitFor(() => expect(screen.getByText('Saved API')).toBeInTheDocument());

    await user.click(screen.getByText('Saved API'));
    await user.click(screen.getByRole('button', { name: 'Open' }));

    await waitFor(() => expect(useAppStore.getState().projectSettingsOpen).toBe(true));
    expect(useSpecStore.getState().hasDocument).toBe(true);
    expect(useAppStore.getState().currentProjectId).toBe('ws-1');
  });

  it('double-clicking a project opens it directly', async () => {
    const user = userEvent.setup();
    vi.mocked(listServerProjects).mockResolvedValue([SERVER_PROJECT]);
    vi.mocked(getServerProject).mockResolvedValue({ ...SERVER_PROJECT, specJson: VALID_SPEC_JSON });
    render(<LoadProjectDialog />);
    await waitFor(() => expect(screen.getByText('Saved API')).toBeInTheDocument());

    await user.dblClick(screen.getByText('Saved API'));

    await waitFor(() => expect(useAppStore.getState().currentProjectId).toBe('ws-1'));
    expect(useAppStore.getState().projectSettingsOpen).toBe(true);
  });

  it('Import OpenAPI Document behaves exactly like the empty-state Import link, and closes this dialog', async () => {
    const user = userEvent.setup();
    vi.mocked(listServerProjects).mockResolvedValue([]);
    useAppStore.setState({ loadProjectOpen: true });
    render(<LoadProjectDialog />);
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

    await waitFor(() => expect(useAppStore.getState().loadProjectOpen).toBe(false));
    const app = useAppStore.getState();
    expect(useSpecStore.getState().hasDocument).toBe(true);
    expect(app.currentProjectName).toBe('Imported API');
    expect(app.projectSettingsOpen).toBe(false);
  });

  it('Import OpenAPI Document leaves the dialog open when the file fails to parse', async () => {
    const user = userEvent.setup();
    vi.mocked(listServerProjects).mockResolvedValue([]);
    useAppStore.setState({ loadProjectOpen: true });
    render(<LoadProjectDialog />);
    await waitFor(() => expect(screen.getByText(/No projects saved to the server yet/)).toBeInTheDocument());

    const file = new File([JSON.stringify({ not: 'an openapi doc' })], 'spec.json', { type: 'application/json' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => expect(useSpecStore.getState().importStatus?.type).toBe('error'));
    expect(useAppStore.getState().loadProjectOpen).toBe(true);
  });

  it('Load from Version Control closes this dialog and opens the version control modal', async () => {
    const user = userEvent.setup();
    vi.mocked(listServerProjects).mockResolvedValue([]);
    render(<LoadProjectDialog />);

    await user.click(screen.getByRole('button', { name: 'Load from Version Control' }));

    expect(useAppStore.getState().loadProjectOpen).toBe(false);
    expect(useAppStore.getState().projectFromVersionControlOpen).toBe(true);
  });

  it('Cancel and the close button both close the dialog', async () => {
    const user = userEvent.setup();
    vi.mocked(listServerProjects).mockResolvedValue([]);
    useAppStore.setState({ loadProjectOpen: true });
    render(<LoadProjectDialog />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(useAppStore.getState().loadProjectOpen).toBe(false);

    useAppStore.setState({ loadProjectOpen: true });
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(useAppStore.getState().loadProjectOpen).toBe(false);
  });
});
