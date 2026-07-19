import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoreMenu } from './MoreMenu';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';
import { saveWorkspace } from '../../lib/workspaces';

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
  localStorage.clear();
});

function noop() {}

describe('MoreMenu — workspace items', () => {
  it('New Workspace opens a blank document and the naming prompt, then closes the menu', async () => {
    const user = userEvent.setup();
    render(<MoreMenu onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /New Workspace/ }));

    expect(useSpecStore.getState().hasDocument).toBe(true);
    expect(useAppStore.getState().workspaceNamePromptOpen).toBe(true);
    expect(useAppStore.getState().moreMenuOpen).toBe(false);
  });

  it('New Workspace opens the unsaved-changes prompt instead, when there is real savable content', async () => {
    const user = userEvent.setup();
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentWorkspaceName: 'My API' });
    render(<MoreMenu onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /New Workspace/ }));

    expect(useAppStore.getState().unsavedChangesPromptOpen).toBe(true);
    expect(useAppStore.getState().moreMenuOpen).toBe(false);
  });

  it('Load Workspace opens the Load Workspace dialog and closes the menu', async () => {
    const user = userEvent.setup();
    render(<MoreMenu onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /Load Workspace/ }));

    expect(useAppStore.getState().loadWorkspaceOpen).toBe(true);
    expect(useAppStore.getState().moreMenuOpen).toBe(false);
  });

  it('Save Workspace is disabled when the workspace has no savable content yet', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentWorkspaceName: 'Untitled API' });
    render(<MoreMenu onExport={noop} onShare={noop} />);

    expect(screen.getByRole('button', { name: /Save Workspace/ })).toBeDisabled();
  });

  it('expanding Save Workspace shows Save to Server (disabled) and Export, once there is savable content', async () => {
    const user = userEvent.setup();
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentWorkspaceName: 'My API' });
    render(<MoreMenu onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /Save Workspace/ }));

    expect(screen.getByRole('button', { name: /Save to Server/ })).toBeDisabled();
    expect(screen.getByText('Export OpenAPI to disk')).toBeInTheDocument();
  });

  it('Export OpenAPI to disk calls onExport and closes the menu', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentWorkspaceName: 'My API' });
    render(<MoreMenu onExport={onExport} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /Save Workspace/ }));
    await user.click(screen.getByText('Export OpenAPI to disk'));

    expect(onExport).toHaveBeenCalled();
    expect(useAppStore.getState().moreMenuOpen).toBe(false);
  });

  it('Workspace Settings opens its modal and closes the menu', async () => {
    const user = userEvent.setup();
    render(<MoreMenu onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: 'Workspace Settings' }));

    expect(useAppStore.getState().workspaceSettingsOpen).toBe(true);
    expect(useAppStore.getState().moreMenuOpen).toBe(false);
  });

  it('Close Workspace is disabled when there is no document loaded', () => {
    render(<MoreMenu onExport={noop} onShare={noop} />);
    expect(screen.getByRole('button', { name: /Close Workspace/ })).toBeDisabled();
  });

  it('Close Workspace is disabled when the workspace has no savable content yet', () => {
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentWorkspaceName: 'Untitled API' });
    render(<MoreMenu onExport={noop} onShare={noop} />);

    expect(screen.getByRole('button', { name: /Close Workspace/ })).toBeDisabled();
  });

  it('Close Workspace closes the document and clears the workspace identity', async () => {
    const user = userEvent.setup();
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentWorkspaceId: 'ws-1', currentWorkspaceName: 'My API' });
    render(<MoreMenu onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /Close Workspace/ }));

    expect(useSpecStore.getState().hasDocument).toBe(false);
    expect(useAppStore.getState().currentWorkspaceId).toBeNull();
    expect(useAppStore.getState().moreMenuOpen).toBe(false);
  });

  it('Recent Workspaces starts collapsed, showing no saved-workspace list', () => {
    render(<MoreMenu onExport={noop} onShare={noop} />);
    expect(screen.queryByText('No saved workspaces yet')).not.toBeInTheDocument();
  });

  it('expanding Recent Workspaces with none saved shows an empty state, and stays expanded (not a menu-closing action)', async () => {
    const user = userEvent.setup();
    render(<MoreMenu onExport={noop} onShare={noop} />);

    const toggle = screen.getByRole('button', { name: /Recent Workspaces/ });
    await user.click(toggle);

    expect(screen.getByText('No saved workspaces yet')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('expanding Recent Workspaces lists saved workspaces, and clicking one reopens it', async () => {
    const user = userEvent.setup();
    saveWorkspace({
      id: 'ws-1',
      name: 'Saved API',
      savedAt: Date.now(),
      specJson: JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'Saved API', version: '1.0.0' },
        paths: { '/things': { get: { responses: { '200': { description: 'OK' } } } } },
      }),
    });
    render(<MoreMenu onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /Recent Workspaces/ }));
    expect(screen.getByText('Saved API')).toBeInTheDocument();

    await user.click(screen.getByText('Saved API'));

    expect(useAppStore.getState().currentWorkspaceId).toBe('ws-1');
    expect(useAppStore.getState().moreMenuOpen).toBe(false);
  });

  it('Recent Workspaces shows at most 5 entries, even when more are saved', async () => {
    const user = userEvent.setup();
    for (let i = 0; i < 7; i++) {
      saveWorkspace({
        id: `ws-${i}`,
        name: `API ${i}`,
        savedAt: 1000 + i,
        specJson: JSON.stringify({
          openapi: '3.1.0',
          info: { title: `API ${i}`, version: '1.0.0' },
          paths: { '/things': { get: { responses: { '200': { description: 'OK' } } } } },
        }),
      });
    }
    render(<MoreMenu onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /Recent Workspaces/ }));

    expect(screen.getAllByText(/^API \d$/)).toHaveLength(5);
    // Most-recently-saved first, so the 5 newest (API 6 down to API 2) should be shown.
    expect(screen.getByText('API 6')).toBeInTheDocument();
    expect(screen.queryByText('API 1')).not.toBeInTheDocument();
  });

  it('removing a Recent Workspaces entry asks for confirmation first, then removes it from the list without touching the workspace itself', async () => {
    const user = userEvent.setup();
    saveWorkspace({
      id: 'ws-1',
      name: 'Saved API',
      savedAt: Date.now(),
      specJson: JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'Saved API', version: '1.0.0' },
        paths: { '/things': { get: { responses: { '200': { description: 'OK' } } } } },
      }),
    });
    useAppStore.setState({ moreMenuOpen: true });
    render(<MoreMenu onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /Recent Workspaces/ }));
    expect(screen.getByText('Saved API')).toBeInTheDocument();

    await user.click(screen.getByTitle("Remove from this list — doesn't delete the project"));
    expect(screen.getByText('Remove from list?')).toBeInTheDocument();
    // Not removed yet — still just a confirmation prompt.
    expect(screen.queryByText('Saved API')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('Saved API')).toBeInTheDocument();

    await user.click(screen.getByTitle("Remove from this list — doesn't delete the project"));
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(screen.getByText('No saved workspaces yet')).toBeInTheDocument();
    expect(useAppStore.getState().moreMenuOpen).toBe(true); // removing doesn't close the menu
  });
});

describe('MoreMenu — moved-in items', () => {
  it('shows Help & Documentation and What’s New (moved here from the user menu)', () => {
    render(<MoreMenu onExport={noop} onShare={noop} />);
    expect(screen.getByText('Help & Documentation')).toBeInTheDocument();
    expect(screen.getByText("What's New")).toBeInTheDocument();
  });
});
