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
    render(<MoreMenu onImport={noop} onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /New Workspace/ }));

    expect(useSpecStore.getState().hasDocument).toBe(true);
    expect(useAppStore.getState().workspaceNamePromptOpen).toBe(true);
    expect(useAppStore.getState().moreMenuOpen).toBe(false);
  });

  it('Workspace from Version Control opens its modal and closes the menu', async () => {
    const user = userEvent.setup();
    render(<MoreMenu onImport={noop} onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /Workspace from Version Control/ }));

    expect(useAppStore.getState().workspaceFromVersionControlOpen).toBe(true);
    expect(useAppStore.getState().moreMenuOpen).toBe(false);
  });

  it('Workspace Settings opens its modal and closes the menu', async () => {
    const user = userEvent.setup();
    render(<MoreMenu onImport={noop} onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: 'Workspace Settings' }));

    expect(useAppStore.getState().workspaceSettingsOpen).toBe(true);
    expect(useAppStore.getState().moreMenuOpen).toBe(false);
  });

  it('Close Workspace is disabled when there is no document loaded', () => {
    render(<MoreMenu onImport={noop} onExport={noop} onShare={noop} />);
    expect(screen.getByRole('button', { name: /Close Workspace/ })).toBeDisabled();
  });

  it('Close Workspace closes the document and clears the workspace identity', async () => {
    const user = userEvent.setup();
    useSpecStore.getState().loadSampleProject();
    useAppStore.setState({ currentWorkspaceId: 'ws-1', currentWorkspaceName: 'My API' });
    render(<MoreMenu onImport={noop} onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /Close Workspace/ }));

    expect(useSpecStore.getState().hasDocument).toBe(false);
    expect(useAppStore.getState().currentWorkspaceId).toBeNull();
    expect(useAppStore.getState().moreMenuOpen).toBe(false);
  });

  it('Recent Workspaces starts collapsed, showing no saved-workspace list', () => {
    render(<MoreMenu onImport={noop} onExport={noop} onShare={noop} />);
    expect(screen.queryByText('No saved workspaces yet')).not.toBeInTheDocument();
  });

  it('expanding Recent Workspaces with none saved shows an empty state, and stays expanded (not a menu-closing action)', async () => {
    const user = userEvent.setup();
    render(<MoreMenu onImport={noop} onExport={noop} onShare={noop} />);

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
    render(<MoreMenu onImport={noop} onExport={noop} onShare={noop} />);

    await user.click(screen.getByRole('button', { name: /Recent Workspaces/ }));
    expect(screen.getByText('Saved API')).toBeInTheDocument();

    await user.click(screen.getByText('Saved API'));

    expect(useAppStore.getState().currentWorkspaceId).toBe('ws-1');
    expect(useAppStore.getState().moreMenuOpen).toBe(false);
  });
});
