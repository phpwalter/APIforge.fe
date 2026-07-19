import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectNameModal } from './ProjectNameModal';
import { useAppStore } from '../../state/useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('ProjectNameModal', () => {
  it('pre-fills the input with the suggested default name', () => {
    useAppStore.getState().startProject('Untitled API');
    render(<ProjectNameModal />);

    expect(screen.getByPlaceholderText('Project name')).toHaveValue('Untitled API');
  });

  it('Save confirms the edited name and closes the prompt', async () => {
    const user = userEvent.setup();
    useAppStore.getState().startProject('Untitled API');
    render(<ProjectNameModal />);

    const input = screen.getByPlaceholderText('Project name');
    await user.clear(input);
    await user.type(input, 'My Payments API');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(useAppStore.getState().currentProjectName).toBe('My Payments API');
    expect(useAppStore.getState().projectNamePromptOpen).toBe(false);
  });

  it('pressing Enter in the input confirms the name', async () => {
    const user = userEvent.setup();
    useAppStore.getState().startProject('Untitled API');
    render(<ProjectNameModal />);

    await user.type(screen.getByPlaceholderText('Project name'), '{Enter}');

    expect(useAppStore.getState().projectNamePromptOpen).toBe(false);
  });

  it('Escape confirms with whatever is currently typed, rather than discarding the project', async () => {
    const user = userEvent.setup();
    useAppStore.getState().startProject('Untitled API');
    render(<ProjectNameModal />);

    await user.keyboard('{Escape}');

    expect(useAppStore.getState().currentProjectName).toBe('Untitled API');
    expect(useAppStore.getState().projectNamePromptOpen).toBe(false);
  });

  it('clicking the backdrop confirms with the current name', async () => {
    const user = userEvent.setup();
    useAppStore.getState().startProject('Untitled API');
    render(<ProjectNameModal />);

    await user.click(screen.getByRole('dialog').parentElement!);

    expect(useAppStore.getState().projectNamePromptOpen).toBe(false);
  });
});
