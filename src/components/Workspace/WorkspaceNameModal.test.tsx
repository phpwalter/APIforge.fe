import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceNameModal } from './WorkspaceNameModal';
import { useAppStore } from '../../state/useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('WorkspaceNameModal', () => {
  it('pre-fills the input with the suggested default name', () => {
    useAppStore.getState().startWorkspace('Untitled API');
    render(<WorkspaceNameModal />);

    expect(screen.getByPlaceholderText('Workspace name')).toHaveValue('Untitled API');
  });

  it('Save confirms the edited name and closes the prompt', async () => {
    const user = userEvent.setup();
    useAppStore.getState().startWorkspace('Untitled API');
    render(<WorkspaceNameModal />);

    const input = screen.getByPlaceholderText('Workspace name');
    await user.clear(input);
    await user.type(input, 'My Payments API');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(useAppStore.getState().currentWorkspaceName).toBe('My Payments API');
    expect(useAppStore.getState().workspaceNamePromptOpen).toBe(false);
  });

  it('pressing Enter in the input confirms the name', async () => {
    const user = userEvent.setup();
    useAppStore.getState().startWorkspace('Untitled API');
    render(<WorkspaceNameModal />);

    await user.type(screen.getByPlaceholderText('Workspace name'), '{Enter}');

    expect(useAppStore.getState().workspaceNamePromptOpen).toBe(false);
  });

  it('Escape confirms with whatever is currently typed, rather than discarding the workspace', async () => {
    const user = userEvent.setup();
    useAppStore.getState().startWorkspace('Untitled API');
    render(<WorkspaceNameModal />);

    await user.keyboard('{Escape}');

    expect(useAppStore.getState().currentWorkspaceName).toBe('Untitled API');
    expect(useAppStore.getState().workspaceNamePromptOpen).toBe(false);
  });

  it('clicking the backdrop confirms with the current name', async () => {
    const user = userEvent.setup();
    useAppStore.getState().startWorkspace('Untitled API');
    render(<WorkspaceNameModal />);

    await user.click(screen.getByRole('dialog').parentElement!);

    expect(useAppStore.getState().workspaceNamePromptOpen).toBe(false);
  });
});
